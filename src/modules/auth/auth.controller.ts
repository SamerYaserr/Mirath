import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
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
import { SignupDto } from './dto/signup.dto';
import { VerifyEmailDto } from './dto/verifyEmail.dto';
import { ResendVerificationDto } from './dto/resendVerification.dto';
import { GoogleAuthDto } from './dto/googleAuth.dto';
import { LoginDto } from './dto/login.dto';
import { CheckVerificationDto } from './dto/checkVerification.dto';

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

  // Use AuthGaurd to protect this route
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

  @Post('is-verified')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Check verification status',
    description:
      'Checks the account status (Verified) for a specific email address.',
  })
  @ApiBody({ type: CheckVerificationDto })
  @ApiResponse({
    status: 200,
    description: 'Status retrieved successfully.',
    schema: {
      example: {
        isVerified: true,
        status: 'ACTIVE',
      },
    },
  })
  @ApiNotFoundResponse({ description: 'User not found.' })
  async checkVerificationStatus(
    @Body() checkVerificationDto: CheckVerificationDto,
  ) {
    return this.authService.checkVerificationStatus(checkVerificationDto);
  }

  // Use AuthGaurd to protect this route
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
    schema: {
      example: {
        isSetupCompleted: false,
        status: 'ONBOARDING',
      },
    },
  })
  async checkSetupStatus(@Req() req: Request) {
    const userId = req.user!.id;
    return this.authService.checkSetupStatus(userId);
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
