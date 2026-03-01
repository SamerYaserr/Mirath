import { ApiProperty } from '@nestjs/swagger';

class SignupUserResDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'user123' })
  username: string;

  @ApiProperty({ example: 'PENDING_VERIFICATION' })
  status: string;
}

class SignupDataResDto {
  @ApiProperty({ type: SignupUserResDto })
  user: SignupUserResDto;
}

export class SignupResDto {
  @ApiProperty({
    example:
      'Signup successful. Please check your email for the verification code.',
  })
  message: string;

  @ApiProperty({ type: SignupDataResDto })
  data: SignupDataResDto;
}
