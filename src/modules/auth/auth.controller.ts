import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import type { Request, Response } from 'express';

import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import { VerifyEmailDto } from './dto/verifyEmail.dto';
import { ResendVerificationDto } from './dto/resendVerification.dto';
import { GoogleAuthDto } from './dto/googleAuth.dto';
import { LoginDto } from './dto/login.dto';
import { ForgetPasswordDto } from './dto/forget-password.dto';
import { VerifyResetCodeDto } from './dto/verify-reset-code.dto';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Post('signup')
  @ApiOperation({
    summary: 'Register a new user',
    description:
      'Creates a new user in pending state and sends an OTP verification email.',
  })
  @ApiBody({ type: SignupDto })
  @ApiResponse({
    status: 201,
    description: 'User successfully created. OTP sent.',
    schema: {
      example: {
        message:
          'Signup successful. Please check your email for the verification code.',
        userId: '123e4567-e89b-12d3-a456-426614174000',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or passwords do not match.',
  })
  @ApiConflictResponse({ description: 'Email or Username already exists.' })
  async signup(@Body() signupDto: SignupDto) {
    console.log('Received signup request:', signupDto);
    return this.authService.signup(signupDto);
  }

  @Post('verify-email')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify email address',
    description: 'Validates OTP, activates account, returns tokens.',
  })
  @ApiBody({ type: VerifyEmailDto })
  @ApiResponse({ status: 200, description: 'Email successfully verified.' })
  @ApiBadRequestResponse({ description: 'Invalid or Expired OTP.' })
  async verifyEmail(
    @Body() verifyEmailDto: VerifyEmailDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } =
      await this.authService.verifyEmail(verifyEmailDto);

    this.setRefreshTokenCookie(res, refreshToken);

    return { accessToken };
  }

  @Post('resend-verification')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Resend Verification OTP',
    description: 'Resends OTP. Limited to 5/hour.',
  })
  @ApiBody({ type: ResendVerificationDto })
  @ApiResponse({ status: 200, description: 'New verification email sent.' })
  async resendVerification(
    @Body() resendVerificationDto: ResendVerificationDto,
  ) {
    return this.authService.resendVerification(resendVerificationDto);
  }

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
  @ApiBody({ type: GoogleAuthDto })
  @ApiResponse({ status: 200, description: 'Authentication successful.' })
  @ApiUnauthorizedResponse({ description: 'Invalid Google Token' })
  @ApiForbiddenResponse({ description: 'Account suspended' })
  async googleAuth(
    @Body() googleAuthDto: GoogleAuthDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.authenticateWithGoogle(googleAuthDto);

    this.setRefreshTokenCookie(res, result.refreshToken);

    return {
      message: result.message,
      user: result.user,
      accessToken: result.accessToken,
    };
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Login',
    description: 'Authenticate user with email/username and password',
  })
  @ApiBody({ type: LoginDto })
  @ApiResponse({
    status: 200,
    description: 'Login successful',
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid credentials',
  })
  @ApiForbiddenResponse({
    description: 'Account not verified or suspended',
  })
  async login(
    @Body() loginDto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.authService.login(loginDto);
    const { message, user, accessToken, refreshToken } = result;

    this.setRefreshTokenCookie(res, refreshToken);

    return {
      message,
      user,
      accessToken,
    };
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
  })
  async logout(@Req() req: Request, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies['refreshToken'];

    await this.authService.logout(refreshToken);

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    });

    return { message: 'Logged out successfully' };
  }

  @Post('forget-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Request password reset OTP',
    description:
      "Sends a 6-digit OTP to the user's email -if exists- for password reset. Returns a generic success message regardless of whether the email exists to prevent user enumeration.",
  })
  @ApiBody({
    type: ForgetPasswordDto,
  })
  @ApiResponse({
    status: 200,
    description:
      'OTP request processed successfully. A verification code has been sent if the email exists.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid email format',
  })
  forgetPassword(@Body() forgetPasswordDto: ForgetPasswordDto) {
    const { email } = forgetPasswordDto;

    return this.authService.forgetPassword(email);
  }

  @Post('verify-reset-code')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Verify password reset OTP',
    description:
      "Verifies the 6-digit OTP sent to the user's email for password reset. Upon successful verification, returns a short-lived reset token that can be used to set a new password.",
  })
  @ApiBody({
    type: VerifyResetCodeDto,
  })
  @ApiResponse({
    status: 200,
    description:
      'OTP verified successfully. Returns a short-lived reset token.',
  })
  @ApiResponse({
    status: 400,
    description: 'Bad Request - Invalid OTP, expired OTP, or validation errors',
  })
  @Post('verify-reset-code')
  @HttpCode(HttpStatus.OK)
  verifyResetCode(@Body() verifyResetCodeDto: VerifyResetCodeDto) {
    const { email, otp } = verifyResetCodeDto;

    return this.authService.verifyResetCode(email, otp);
  }

  private setRefreshTokenCookie(res: Response, token: string) {
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
}
