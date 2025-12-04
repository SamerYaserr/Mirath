import { Body, Controller, Post } from '@nestjs/common';

import { AuthService } from './auth.service';
import { SignupDto } from './dto/signup.dto';
import {
  ApiBadRequestResponse,
  ApiBody,
  ApiConflictResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
}
