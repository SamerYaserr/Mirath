import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { SignupReqDto } from './dto/requests/signup.req.dto';
import { VerifyEmailReqDto } from './dto/requests/verify-email.req.dto';
import { ResendVerificationReqDto } from './dto/requests/resend-verification.req.dto';
import { GoogleAuthReqDto } from './dto/requests/google-auth.req.dto';
import { LoginReqDto } from './dto/requests/login.req.dto';
import { ForgetPasswordReqDto } from './dto/requests/forget-password.req.dto';
import { VerifyResetCodeReqDto } from './dto/requests/verify-reset-code.req.dto';
import { ResetPasswordReqDto } from './dto/requests/reset-password.req.dto';
import { CheckVerificationReqDto } from './dto/requests/check-verification.req.dto';
import { Public } from '../../common/decorators/public.decorator';

import { SignupResDto } from './dto/responses/signup.res.dto';
import { VerifyEmailResDto } from './dto/responses/verify-email.res.dto';
import { GoogleAuthResDto } from './dto/responses/google-auth.res.dto';
import { LoginResDto } from './dto/responses/login.res.dto';
import { CheckVerificationResDto } from './dto/responses/check-verification.res.dto';
import { CheckSetupResDto } from './dto/responses/check-setup.res.dto';
import { VerifyResetCodeResDto } from './dto/responses/verify-reset-code.res.dto';
import { RefreshTokenResDto } from './dto/responses/refresh-token.res.dto';
import { MessageResDto } from '../../common/dto/message.res.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('signup')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user in pending state and sends an OTP verification email.',
  })
  @ApiBody({ type: SignupReqDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully created. OTP sent.',
    type: SignupResDto,
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or passwords do not match.',
  })
  @ApiConflictResponse({ description: 'Email or Username already exists.' })
  async signup(@Body() signupReqDto: SignupReqDto): Promise<SignupResDto> {
    return this.authService.signup(signupReqDto);
  }

  @Public()
  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email address',
    description: 'Validates OTP, activates account, returns tokens.',
  })
  @ApiBody({ type: VerifyEmailReqDto })
  @ApiResponse({
    status: 200,
    description: 'Email successfully verified.',
    type: VerifyEmailResDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid or Expired OTP.' })
  async verifyEmail(
    @Body() verifyEmailReqDto: VerifyEmailReqDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<VerifyEmailResDto> {
    const { accessToken, refreshToken } =
      await this.authService.verifyEmail(verifyEmailReqDto);

    this.setRefreshTokenCookie(res, refreshToken);

    return { accessToken };
  }

  @Public()
  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend Verification OTP',
    description: 'Resends OTP. Limited to 5/hour.',
  })
  @ApiBody({ type: ResendVerificationReqDto })
  @ApiResponse({
    status: 200,
    description: 'New verification email sent.',
    type: MessageResDto,
  })
  async resendVerification(
    @Body() resendVerificationReqDto: ResendVerificationReqDto,
  ): Promise<MessageResDto> {
    return this.authService.resendVerification(resendVerificationReqDto);
  }

  @Public()
  @Post('google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Google Authentication (Login & Signup)',
    description: `
      **Handles both Signup and Login:**
      - If the user **exists**, it logs them in.
      - If the user **does not exist**, it creates an account and logs them in.
      **How to use:**
      1. **Frontend:** Use the Google Identity Services SDK (or React/Flutter wrapper) to sign the user in.
      2. **Frontend:** Receive the \`credential\` (this is the **ID Token**).
      3. **Frontend:** Send a POST request to this endpoint with \`{ "idToken": "YOUR_ID_TOKEN" }\`.
      4. **Backend:** Verifies the token, creates/logs in the user, and sets the HttpOnly Refresh Token cookie.
    `,
  })
  @ApiBody({ type: GoogleAuthReqDto })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful.',
    type: GoogleAuthResDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid Google Token' })
  @ApiForbiddenResponse({ description: 'Account suspended' })
  async googleAuth(
    @Body() googleAuthReqDto: GoogleAuthReqDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<GoogleAuthResDto> {
    const { message, user, accessToken, refreshToken } =
      await this.authService.authenticateWithGoogle(googleAuthReqDto);

    this.setRefreshTokenCookie(res, refreshToken);

    return { message, user, accessToken };
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login',
    description: 'Authenticate user with email/username and password',
  })
  @ApiBody({ type: LoginReqDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
    type: LoginResDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
  })
  @ApiForbiddenResponse({
    description: 'Account not verified or suspended',
  })
  async login(
    @Body() loginReqDto: LoginReqDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<LoginResDto> {
    const { message, user, accessToken, refreshToken } =
      await this.authService.login(loginReqDto);

    this.setRefreshTokenCookie(res, refreshToken);

    return { message, user, accessToken };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Logout',
    description:
      'Invalidates the current session and clears the refresh token cookie.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged out.',
    type: MessageResDto,
  })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<MessageResDto> {
    const refreshToken = req.cookies?.['refreshToken'];

    await this.authService.logout(refreshToken);

    this.clearRefreshTokenCookie(res);

    return { message: 'Logged out successfully' };
  }

  @Public()
  @Post('forget-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset OTP',
    description:
      "Sends a 6-digit OTP to the user's email -if exists- for password reset. Returns a generic success message regardless of whether the email exists to prevent user enumeration.",
  })
  @ApiBody({
    type: ForgetPasswordReqDto,
  })
  @ApiResponse({
    status: 200,
    description:
      'OTP request processed successfully. A verification code has been sent if the email exists.',
    type: MessageResDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid email format',
  })
  forgetPassword(
    @Body() forgetPasswordReqDto: ForgetPasswordReqDto,
  ): Promise<MessageResDto> {
    return this.authService.forgetPassword(forgetPasswordReqDto);
  }

  @Public()
  @Post('verify-reset-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify password reset OTP',
    description:
      "Verifies the 6-digit OTP sent to the user's email for password reset. Upon successful verification, returns a short-lived reset token that can be used to set a new password.",
  })
  @ApiBody({
    type: VerifyResetCodeReqDto,
  })
  @ApiResponse({
    status: 200,
    description:
      'OTP verified successfully. Returns a short-lived reset token.',
    type: VerifyResetCodeResDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid OTP, expired OTP, or validation errors',
  })
  verifyResetCode(
    @Body() verifyResetCodeReqDto: VerifyResetCodeReqDto,
  ): Promise<VerifyResetCodeResDto> {
    return this.authService.verifyResetCode(verifyResetCodeReqDto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Reset user password',
    description:
      "Resets the user's password using a valid reset token obtained from the verify-reset-code endpoint. This action will log out the user from all devices by invalidating all refresh tokens.",
  })
  @ApiBody({
    description: 'Reset token and new password details',
    type: ResetPasswordReqDto,
  })
  @ApiResponse({
    status: 200,
    description:
      'Password reset successfully. User is logged out from all devices.',
    type: MessageResDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad Request - Passwords do not match or do not meet strength requirements',
  })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - Reset token is not valid, not for password reset, or user not found',
  })
  resetPassword(
    @Body() resetPasswordReqDto: ResetPasswordReqDto,
  ): Promise<MessageResDto> {
    return this.authService.resetPassword(resetPasswordReqDto);
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiCookieAuth('refreshToken')
  @ApiOperation({
    summary: 'Rotate refresh token and issue new session tokens',
    description: `
Uses the refresh token stored in the secure HTTP-only cookie to rotate the session. 
Returns a new access token and a newly rotated refresh token.
If the refresh token is invalid, revoked, or expired, the operation will fail with 401.
    `,
  })
  @ApiResponse({
    status: 200,
    description: 'Tokens refreshed successfully.',
    type: RefreshTokenResDto,
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid, missing, or expired refresh token.',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<RefreshTokenResDto> {
    const token = req.cookies?.['refreshToken'];

    if (!token) {
      throw new UnauthorizedException(
        'Invalid, missing, or expired refresh token.',
      );
    }

    const { accessToken, refreshToken } =
      await this.authService.rotateRefreshToken(token);

    this.setRefreshTokenCookie(res, refreshToken);

    return {
      message: 'Tokens refreshed successfully.',
      accessToken,
    };
  }

  @Public()
  @Post('is-verified')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check verification status',
    description:
      'Checks the account status (Verified) for a specific email address.',
  })
  @ApiBody({ type: CheckVerificationReqDto })
  @ApiResponse({
    status: 200,
    description: 'Status retrieved successfully.',
    type: CheckVerificationResDto,
  })
  @ApiNotFoundResponse({ description: 'User not found.' })
  async checkVerificationStatus(
    @Body() checkVerificationReqDto: CheckVerificationReqDto,
  ): Promise<CheckVerificationResDto> {
    return this.authService.checkVerificationStatus(checkVerificationReqDto);
  }

  @Get('check-setup')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Check setup completion',
    description:
      'Checks if the currently logged-in user has completed the onboarding setup.',
  })
  @ApiResponse({
    status: 200,
    description: 'Setup status retrieved.',
    type: CheckSetupResDto,
  })
  async checkSetupStatus(@Req() req: Request): Promise<CheckSetupResDto> {
    const userId = req.user!.id;
    return this.authService.checkSetupStatus(userId);
  }

  private setRefreshTokenCookie(res: Response, token: string): void {
    const refreshDays = this.configService.get<number>(
      'JWT_REFRESH_EXPIRATION_DAYS',
      7,
    );

    res.cookie('refreshToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: refreshDays * 24 * 60 * 60 * 1000,
      path: '/',
    });
  }

  private clearRefreshTokenCookie(res: Response): void {
    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: this.configService.get<string>('NODE_ENV') === 'production',
      sameSite: 'lax',
      path: '/',
    });
  }
}
