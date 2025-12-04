import {
  Injectable,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { OtpPurpose, UserStatus } from '@prisma/client';

import { SignupDto } from './dto/signup.dto';
import { UserRepository } from './repositories/user.repository';
import { OtpRepository } from './repositories/otp.repository';
import { MailService } from '../mail/mail.service';
import { winstonLogger } from 'src/config/logger.config';
import { TokenService } from './utils/token.service';
import { RefreshTokenRepository } from './repositories/refreshToken.repository';
import { VerifyEmailDto } from './dto/verifyEmail.dto';

@Injectable()
export class AuthService {
  constructor(
    private userRepository: UserRepository,
    private otpRepository: OtpRepository,
    private refreshTokenRepository: RefreshTokenRepository,
    private mailService: MailService,
    private configService: ConfigService,
    private tokenService: TokenService,
  ) {}

  async signup(signupDto: SignupDto) {
    if (signupDto.password !== signupDto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    console.log('Checking existing user for signup...');

    const existingUser = await this.userRepository.findByEmailOrUsername(
      signupDto.email,
      signupDto.username,
    );
    if (existingUser) {
      switch (existingUser.status) {
        // Case: User started signup but didn't finish OTP
        case UserStatus.PENDING_VERIFICATION:
          throw new ForbiddenException(
            'Account already created but not verified. Please verify your email or request a new code.',
          );

        // Case: User is blocked/suspended
        case UserStatus.SUSPENDED:
        case UserStatus.BANNED:
          throw new ForbiddenException(
            'Your account has been suspended or banned. Please contact support.',
          );

        // Case: User deactivated their account previously
        case UserStatus.DEACTIVATED:
          throw new ForbiddenException(
            'Your account is deactivated. Please contact support to reactivate it.',
          );

        // Case: Normal active user trying to sign up again
        case UserStatus.ACTIVE:
          throw new ConflictException(
            'Account already exists with this email or username.',
          );

        default:
          throw new InternalServerErrorException('Unknown account status.');
      }
    }

    const hashedPassword = await bcrypt.hash(signupDto.password, 10);

    const newUser = await this.userRepository.create({
      email: signupDto.email,
      username: signupDto.username,
      password: hashedPassword,
      status: UserStatus.PENDING_VERIFICATION,
    });

    await this.generateAndSendOtp(newUser.id, newUser.email);

    winstonLogger.info(
      `User ${newUser.id} signed up successfully. OTP sent to ${newUser.email}`,
    );
    return {
      message:
        'Signup successful. Please check your email for the verification code.',
      userId: newUser.id,
    };
  }

  async verifyEmail(dto: VerifyEmailDto) {
    const user = await this.userRepository.findByEmail(dto.email);
    if (!user) throw new BadRequestException('Invalid request');

    const otpRecord = await this.otpRepository.findPendingOtp(
      user.id,
      OtpPurpose.REGISTER,
    );

    if (!otpRecord) throw new BadRequestException('Invalid or expired OTP');

    const isMatch = await bcrypt.compare(dto.otp, otpRecord.otpCode);
    if (!isMatch) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    await this.otpRepository.markAsUsed(otpRecord.id);
    const updatedUser = await this.userRepository.updateStatus(
      user.id,
      UserStatus.ACTIVE,
    );

    await this.mailService.sendWelcome(user);

    return this.createSession(updatedUser.id, updatedUser.email);
  }

  // --- Helpers ---

  private async generateAndSendOtp(userId: string, email: string) {
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const expirationMinutes = this.configService.get<number>(
      'OTP_EXPIRATION_MINUTES',
      10,
    );
    const expiresAt = new Date(Date.now() + expirationMinutes * 60 * 1000);

    await this.otpRepository.create({
      userId,
      otpCode: otp,
      purpose: OtpPurpose.REGISTER,
      expiresAt,
    });

    await this.mailService.sendOtpEmail(email, otp);
  }

  private async createSession(userId: string, email: string) {
    const refreshExpiresAt = this.tokenService.getRefreshTokenExpiresAt();

    const refreshTokenRecord = await this.refreshTokenRepository.create(
      userId,
      refreshExpiresAt,
    );

    const { accessToken, refreshToken } =
      await this.tokenService.generateAuthTokens(
        userId,
        email,
        refreshTokenRecord.id,
      );

    return { accessToken, refreshToken };
  }
}
