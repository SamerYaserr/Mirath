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
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
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

import { SignupDataResDto } from './dto/responses/signup.res.dto';
import { LoginDataResDto } from './dto/responses/login.res.dto';
import { CheckVerificationResDto } from './dto/responses/check-verification.res.dto';
import { CheckSetupResDto } from './dto/responses/check-setup.res.dto';
import { HttpResponse } from 'src/common/types/api.types';
import {
  AccessTokenResDto,
  ResetTokenResDto,
} from './dto/responses/auth-token.res.dto';
import { clearRefreshTokenCookie } from 'src/common/utils/clear-cookie.utils';

@ApiTags('Authentication')
@Controller('auth')
@ApiExtraModels(
  SignupDataResDto,
  AccessTokenResDto,
  LoginDataResDto,
  CheckVerificationResDto,
  CheckSetupResDto,
  ResetTokenResDto,
)
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
    schema: {
      properties: {
        message: {
          type: 'string',
          example:
            'Signup successful. Please check your email for the verification code.',
        },
        data: { type: 'object', $ref: getSchemaPath(SignupDataResDto) },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or passwords do not match.',
  })
  @ApiConflictResponse({ description: 'Email or Username already exists.' })
  async signup(
    @Body() signupReqDto: SignupReqDto,
  ): Promise<HttpResponse<SignupDataResDto>> {
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
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Email verified successfully.',
        },
        data: { type: 'object', $ref: getSchemaPath(AccessTokenResDto) },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid or Expired OTP.' })
  async verifyEmail(
    @Body() verifyEmailReqDto: VerifyEmailReqDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<HttpResponse<AccessTokenResDto>> {
    const { accessToken, refreshToken } =
      await this.authService.verifyEmail(verifyEmailReqDto);

    this.setRefreshTokenCookie(res, refreshToken);

    return {
      message: 'Email verified successfully.',
      data: AccessTokenResDto.fromToken(accessToken),
    };
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
    schema: {
      example: {
        message: 'Verification code resent successfully.',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Too many resend attempts. Please try again later.',
  })
  @ApiNotFoundResponse({ description: 'User not found.' })
  @ApiConflictResponse({ description: 'Account already verified.' })
  async resendVerification(
    @Body() resendVerificationReqDto: ResendVerificationReqDto,
  ): Promise<HttpResponse<null>> {
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
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Logged in successfully',
        },
        data: { type: 'object', $ref: getSchemaPath(LoginDataResDto) },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Invalid Google Token' })
  @ApiForbiddenResponse({ description: 'Account suspended' })
  async googleAuth(
    @Body() googleAuthReqDto: GoogleAuthReqDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<HttpResponse<LoginDataResDto>> {
    const { message, user, accessToken, refreshToken } =
      await this.authService.authenticateWithGoogle(googleAuthReqDto);

    this.setRefreshTokenCookie(res, refreshToken);

    return { message, data: LoginDataResDto.fromAuthData(user, accessToken) };
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
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Logged in successfully',
        },
        data: { type: 'object', $ref: getSchemaPath(LoginDataResDto) },
      },
    },
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
  ): Promise<HttpResponse<LoginDataResDto>> {
    const { message, user, accessToken, refreshToken } =
      await this.authService.login(loginReqDto);

    this.setRefreshTokenCookie(res, refreshToken);

    return { message, data: LoginDataResDto.fromAuthData(user, accessToken) };
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
    schema: {
      example: {
        message: 'Logged out successfully',
      },
    },
  })
  async logout(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<HttpResponse<null>> {
    const refreshToken = req.cookies?.['refreshToken'];

    await this.authService.logout(refreshToken);

    clearRefreshTokenCookie(res);

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
    schema: {
      example: {
        message: 'Please check your email for the verification code.',
      },
    },
  })
  forgetPassword(
    @Body() forgetPasswordReqDto: ForgetPasswordReqDto,
  ): Promise<HttpResponse<null>> {
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
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'OTP verified successfully.',
        },
        data: { type: 'object', $ref: getSchemaPath(ResetTokenResDto) },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Bad Request - Invalid OTP, expired OTP, or validation errors',
  })
  @ApiForbiddenResponse({
    description:
      'Forbidden - user account is suspended, banned, or deactivated',
  })
  verifyResetCode(
    @Body() verifyResetCodeReqDto: VerifyResetCodeReqDto,
  ): Promise<HttpResponse<ResetTokenResDto>> {
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
    schema: {
      example: {
        message: 'Password reset successfully.',
      },
    },
  })
  @ApiBadRequestResponse({
    description:
      'Bad Request - Passwords do not match or do not meet strength requirements',
  })
  @ApiForbiddenResponse({
    description:
      'Forbidden - Reset token is not valid, not for password reset, or user not found',
  })
  resetPassword(
    @Body() resetPasswordReqDto: ResetPasswordReqDto,
  ): Promise<HttpResponse<null>> {
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
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Tokens refreshed successfully.',
        },
        data: { type: 'object', $ref: getSchemaPath(AccessTokenResDto) },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Invalid, missing, or expired refresh token.',
  })
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ): Promise<HttpResponse<AccessTokenResDto>> {
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
      data: AccessTokenResDto.fromToken(accessToken),
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
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Verification status retrieved successfully.',
        },
        data: { type: 'object', $ref: getSchemaPath(CheckVerificationResDto) },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed for the provided email.',
  })
  @ApiNotFoundResponse({ description: 'User not found.' })
  async checkVerificationStatus(
    @Body() checkVerificationReqDto: CheckVerificationReqDto,
  ): Promise<HttpResponse<CheckVerificationResDto>> {
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
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Setup status retrieved successfully.',
        },
        data: { type: 'object', $ref: getSchemaPath(CheckSetupResDto) },
      },
    },
  })
  @ApiUnauthorizedResponse({
    description: 'Unauthorized - Missing or invalid access token.',
  })
  @ApiNotFoundResponse({ description: 'User not found.' })
  async checkSetupStatus(
    @Req() req: Request,
  ): Promise<HttpResponse<CheckSetupResDto>> {
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
