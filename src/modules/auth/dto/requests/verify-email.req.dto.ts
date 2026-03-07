import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyEmailReqDto {
  @ApiProperty({
    description: 'The email address associated with the OTP',
    example: 'student@university.edu',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'The 6-digit one-time password sent to the email',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @Length(6, 6)
  otp: string;
}
