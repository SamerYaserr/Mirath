import {
  Injectable,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { OtpPurpose, User, UserStatus } from '@prisma/client';
import { LoginTicket, OAuth2Client } from 'google-auth-library';

import { SignupDto } from './dto/signup.dto';
import { UsersRepository } from '../users/repositories/users.repository';
import { OtpRepository } from './repositories/otp.repository';
import { MailService } from '../mail/mail.service';
import { winstonLogger } from 'src/config/logger.config';
import { TokenService } from './utils/token.service';
import { RefreshTokenRepository } from './repositories/refreshToken.repository';
import { VerifyEmailDto } from './dto/verify-email.dto';
import { ResendVerificationDto } from './dto/resend-verification.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { LoginDto } from './dto/login.dto';
import { CheckVerificationDto } from './dto/check-verification.dto';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private usersRepository: UsersRepository,
    private otpRepository: OtpRepository,
    private refreshTokenRepository: RefreshTokenRepository,
    private mailService: MailService,
    private configService: ConfigService,
    private tokenService: TokenService,
  ) {
    this.googleClient = new OAuth2Client(
      this.configService.get('GOOGLE_CLIENT_ID'),
      this.configService.get('GOOGLE_CLIENT_SECRET'),
    );
  }

  async signup(signupDto: SignupDto) {
    if (signupDto.password !== signupDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const existingUser = await this.usersRepository.findByEmailOrUsername(
      signupDto.email,
      signupDto.username,
    );
    if (existingUser) {
      if (
        existingUser.email === signupDto.email &&
        existingUser.username === signupDto.username
      ) {
        switch (existingUser.status) {
          case UserStatus.PENDING_VERIFICATION:
            throw new ConflictException(
              'An account with this email and username already exists but is pending verification. Please verify your email or request a new code.',
            );

          case UserStatus.ACTIVE:
            throw new ConflictException(
              'An account with this email and username already exists.',
            );

          case UserStatus.SUSPENDED:
          case UserStatus.BANNED:
            throw new ConflictException(
              'An account with this email and username exists but has been suspended. Please contact support.',
            );

          case UserStatus.DEACTIVATED:
            throw new ConflictException(
              'An account with this email and username exists but is deactivated. Please contact support to reactivate your account.',
            );
        }
      }

      if (existingUser.email === signupDto.email) {
        throw new ConflictException('Email is already in use');
      }
      if (existingUser.username === signupDto.username) {
        throw new ConflictException('Username is already in use');
      }
    }

    const hashedPassword = await bcrypt.hash(signupDto.password, 10);

    const newUser = await this.usersRepository.create({
      email: signupDto.email,
      username: signupDto.username,
      password: hashedPassword,
      status: UserStatus.PENDING_VERIFICATION,
    });

    await this.generateAndSendOtp(
      newUser.id,
      newUser.email,
      OtpPurpose.REGISTER,
    );

    winstonLogger.info(
      `User ${newUser.id} signed up successfully. OTP sent to ${newUser.email}`,
    );
    return {
      message:
        'Signup successful. Please check your email for the verification code.',
      userId: newUser.id,
    };
  }

  async verifyEmail(verifyEmailDto: VerifyEmailDto) {
    const user = await this.usersRepository.findByEmail(verifyEmailDto.email);
    if (!user) throw new BadRequestException('Invalid request');

    const otpRecord = await this.otpRepository.findPendingOtp(
      user.id,
      OtpPurpose.REGISTER,
    );

    if (!otpRecord) throw new BadRequestException('Invalid or expired OTP');

    const isMatch = await bcrypt.compare(verifyEmailDto.otp, otpRecord.otpCode);
    if (!isMatch) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.otpRepository.markAsUsed(otpRecord.id);
    const updatedUser = await this.usersRepository.updateStatus(
      user.id,
      UserStatus.ONBOARDING,
    );

    await this.mailService.sendWelcome(user);

    return this.createSession(updatedUser, 'Email verified successfully');
  }

  async resendVerification(resendVerificationDto: ResendVerificationDto) {
    const user = await this.usersRepository.findByEmail(
      resendVerificationDto.email,
    );
    if (!user) throw new BadRequestException('User not found');
    if (user.status === UserStatus.ACTIVE)
      throw new BadRequestException('Account already verified');

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentOtps = await this.otpRepository.countRecentOtps(
      user.id,
      OtpPurpose.REGISTER,
      oneHourAgo,
    );

    if (recentOtps >= 5) {
      throw new BadRequestException(
        'Too many resend attempts. Please try again later.',
      );
    }

    await this.otpRepository.invalidatePendingOtps(
      user.id,
      OtpPurpose.REGISTER,
    );

    await this.generateAndSendOtp(user.id, user.email, OtpPurpose.REGISTER);

    return { message: 'Verification code resent successfully' };
  }

  async authenticateWithGoogle(googleAuthDto: GoogleAuthDto) {
    let ticket: LoginTicket | undefined;
    try {
      const googleClientId = this.configService.get<string>('GOOGLE_CLIENT_ID');
      if (!googleClientId) {
        throw new InternalServerErrorException(
          'Google Client ID is not configured',
        );
      }

      ticket = await this.googleClient.verifyIdToken({
        idToken: googleAuthDto.idToken,
        audience: googleClientId,
      });
    } catch (error) {
      winstonLogger.error('Google ID Token verification failed', { error });
      throw new UnauthorizedException('Invalid or expired Google token');
    }

    const payload = ticket.getPayload();

    if (!payload) throw new UnauthorizedException('Invalid token payload');
    if (!payload.sub)
      throw new UnauthorizedException('Missing Google user ID (sub)');
    if (!payload.email)
      throw new UnauthorizedException('Email not provided by Google');
    if (!payload.email_verified)
      throw new UnauthorizedException('Google email not verified');

    const email = payload.email.toLowerCase();
    let user = await this.usersRepository.findByEmail(email);

    // Existing user
    if (user) {
      // Block suspended/banned/deactivated
      if (
        user.status === UserStatus.SUSPENDED ||
        user.status === UserStatus.BANNED
      ) {
        throw new ForbiddenException(
          'This account has been suspended. Please contact support.',
        );
      }
      if (user.status === UserStatus.DEACTIVATED) {
        throw new ForbiddenException(
          'Your account is deactivated. Please request reactivation.',
        );
      }

      // Auto-activate pending users
      if (user.status === UserStatus.PENDING_VERIFICATION) {
        user = await this.usersRepository.updateStatus(
          user.id,
          UserStatus.ACTIVE,
        );
      }

      if (!user.providerId || user.providerId !== payload.sub) {
        if (user.providerId) {
          winstonLogger.warn(
            `User ${user.id} logging in with different Google account`,
          );
          throw new ConflictException(
            'This email is already associated with a different Google account. Please use the correct Google account to log in.',
          );
        }
        await this.usersRepository.updateGoogleProvider(
          user.id,
          payload.sub,
          payload.picture ?? '',
        );
      }

      return this.createSession(user, 'Logged in successfully');
    }

    // Create New User
    winstonLogger.info(`Creating new Google user: ${email}`);

    const baseUsername =
      email.split('@')[0]!.replace(/[^a-zA-Z0-9]/g, '') || 'user';
    let username = `${baseUsername}_${Date.now().toString(36)}`;

    user = await this.usersRepository.create({
      email,
      username,
      fullName: payload.name || payload.given_name || 'User',
      providerId: payload.sub,
      photoUrl: payload.picture ?? null,
      status: UserStatus.ACTIVE,
      isEmailVisible: true,
    });

    return this.createSession(user, 'Account created successfully with Google');
  }

  async login(loginDto: LoginDto) {
    winstonLogger.info(`Login attempt for: ${loginDto.emailOrUsername}`);

    const { emailOrUsername, password } = loginDto;
    const isEmail = emailOrUsername.includes('@');

    const user = await this.usersRepository.findByEmailOrUsername(
      isEmail ? emailOrUsername : '',
      isEmail ? '' : emailOrUsername,
    );

    if (!user) {
      winstonLogger.warn(`Invlaid login username/email for ${emailOrUsername}`);
      throw new UnauthorizedException('Invalid email/username or password');
    }

    if (!user.password) {
      winstonLogger.warn(
        `User ${emailOrUsername} attempted password login but account is Google-only`,
      );
      throw new UnauthorizedException(
        'This account uses Google Sign-In. Please log in with Google.',
      );
    }

    const isCorrectPass = await bcrypt.compare(password, user.password!);
    if (!isCorrectPass) {
      winstonLogger.warn(`Invlaid login password for ${emailOrUsername}`);
      throw new UnauthorizedException('Invalid email/username or password');
    }

    const status = user.status;
    if (status === UserStatus.PENDING_VERIFICATION)
      throw new ForbiddenException(
        'Please verify your email or request a new code.',
      );

    if (status === UserStatus.BANNED || status === UserStatus.SUSPENDED)
      throw new ForbiddenException(
        'Your account has been suspended or banned. Please contact support.',
      );

    if (status === UserStatus.DEACTIVATED)
      throw new ForbiddenException(
        'Your account is deactivated. Please contact support to reactivate it.',
      );

    await this.refreshTokenRepository.countActiveAndDeleteOldestToken(user.id);
    winstonLogger.info(`User ${emailOrUsername} logged in successfully`);
    return await this.createSession(user, 'Logged in successfully');
  }

  async logout(refreshToken: string) {
    let payload = await this.tokenService.verifyRefreshToken(refreshToken);
    await this.refreshTokenRepository.deleteBySessionId(payload.sid);

    winstonLogger.info(
      `Session ${payload.sid} logged out/revoked successfully`,
    );
  }

  async forgetPassword(email: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (user) {
      await this.otpRepository.invalidatePendingOtps(
        user.id,
        OtpPurpose.RESET_PASSWORD,
      );

      await this.generateAndSendOtp(
        user.id,
        user.email,
        OtpPurpose.RESET_PASSWORD,
      );
      winstonLogger.info(
        `User ${user.id} requested a forget-password OTP. OTP sent to ${user.email}`,
      );
    }

    return {
      message: 'Please check your email for the verification code.',
    };
  }

  async verifyResetCode(email: string, otp: string) {
    const user = await this.usersRepository.findByEmail(email);
    if (!user) throw new BadRequestException('Invalid or expired OTP');

    const status = user.status;
    if (status === UserStatus.BANNED || status === UserStatus.SUSPENDED)
      throw new ForbiddenException(
        'Your account has been suspended or banned. Please contact support.',
      );

    if (status === UserStatus.DEACTIVATED)
      throw new ForbiddenException(
        'Your account is deactivated. Please contact support to reactivate it.',
      );

    const storedOtp = await this.otpRepository.findPendingOtp(
      user.id,
      OtpPurpose.RESET_PASSWORD,
    );
    if (!storedOtp) throw new BadRequestException('Invalid or expired OTP');

    const isMatch = await bcrypt.compare(otp, storedOtp.otpCode);
    if (!isMatch) {
      winstonLogger.warn(`Password reset code mismatch for email: ${email}`);
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.otpRepository.markAsUsed(storedOtp.id);

    const payload = {
      userId: user.id,
      forPasswordReset: true,
    };
    const resetToken = await this.tokenService.generateResetToken(payload);
    return { resetToken };
  }

  async resetPassword(
    resetToken: string,
    password: string,
    confirmPassword: string,
  ) {
    if (password !== confirmPassword)
      throw new BadRequestException('Passwords do not match');

    const verifiedToken = await this.tokenService.verifyResetToken(resetToken);
    if (!verifiedToken || !verifiedToken.forPasswordReset)
      throw new ForbiddenException('Reset token is invalid or expired');

    const user = await this.usersRepository.findById(verifiedToken.userId);
    if (!user)
      throw new ForbiddenException('Reset token is invalid or expired');

    const status = user.status;
    if (status === UserStatus.BANNED || status === UserStatus.SUSPENDED)
      throw new ForbiddenException(
        'Your account has been suspended or banned. Please contact support.',
      );

    if (status === UserStatus.DEACTIVATED)
      throw new ForbiddenException(
        'Your account is deactivated. Please contact support to reactivate it.',
      );

    const hashedPassword = await bcrypt.hash(password, 10);
    await this.usersRepository.updatePassword(user.id, hashedPassword);

    await this.refreshTokenRepository.deleteByUserId(user.id);

    winstonLogger.info(`User ${user.email} successfully reset their password`);
    return { message: 'Password reset successfully.' };
  }

  async checkVerificationStatus(checkVerificationDto: CheckVerificationDto) {
    const user = await this.usersRepository.findByEmail(
      checkVerificationDto.email,
    );

    if (!user) {
      throw new NotFoundException('User with this email does not exist');
    }

    const isVerified = user.status !== UserStatus.PENDING_VERIFICATION;

    return {
      isVerified,
      status: user.status,
    };
  }

  async checkSetupStatus(userId: string) {
    const user = await this.usersRepository.findById(userId);
    const isSetupCompleted = user!.status === UserStatus.ACTIVE;

    return {
      isSetupCompleted,
      status: user!.status,
    };
  }

  async rotateRefreshToken(
    token: string,
  ): Promise<{ accessToken: string; refreshToken: string }> {
    let jti: string;

    try {
      ({ jti } = await this.tokenService.verifyRefreshToken(token));
    } catch (error) {
      throw new UnauthorizedException(
        'Invalid, missing, or expired refresh token.',
      );
    }
    const existing = await this.refreshTokenRepository.findById(jti);

    if (!existing) {
      throw new UnauthorizedException(
        'Invalid, missing, or expired refresh token.',
      );
    }

    const user = await this.usersRepository.findById(existing.userId);

    if (
      !user ||
      user.status === UserStatus.SUSPENDED ||
      user.status === UserStatus.BANNED ||
      user.status === UserStatus.DEACTIVATED
    ) {
      throw new UnauthorizedException(
        'Invalid, missing, or expired refresh token.',
      );
    }

    const expireAt = this.tokenService.getRefreshTokenExpiresAt();
    const sessionId = existing.sessionId;

    const newToken =
      await this.refreshTokenRepository.atomicDeleteByIdAndCreate(
        user.id,
        jti,
        expireAt,
        sessionId,
      );

    const { accessToken, refreshToken } =
      await this.tokenService.generateAuthTokens(
        user.id,
        user.email,
        newToken.id,
        sessionId,
      );

    return {
      accessToken,
      refreshToken,
    };
  }

  // --- Helpers ---

  private async generateAndSendOtp(
    userId: string,
    email: string,
    purpose: OtpPurpose,
  ) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const hashedOtp = await bcrypt.hash(otp, 10);

    const expirationMinutes = this.configService.get<number>(
      'OTP_EXPIRATION_MINUTES',
      10,
    );
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

    await this.otpRepository.create({
      userId,
      otpCode: hashedOtp,
      purpose,
      expiresAt,
    });

    await this.mailService.sendOtpEmail(email, otp);
  }

  private async createSession(user: User, message: string) {
    const refreshExpiresAt = this.tokenService.getRefreshTokenExpiresAt();

    const sessionId = uuidv4();

    const refreshTokenRecord = await this.refreshTokenRepository.create(
      user.id,
      refreshExpiresAt,
      sessionId,
    );

    const { accessToken, refreshToken } =
      await this.tokenService.generateAuthTokens(
        user.id,
        user.email,
        refreshTokenRecord.id,
        sessionId,
      );

    return {
      message,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        photoUrl: user.photoUrl,
        status: user.status,
      },
      accessToken,
      refreshToken,
    };
  }
}
