import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResendVerificationDto {
  @ApiProperty({
    description: 'The email address to resend the verification code to',
    example: 'student@university.edu',
  })
  @IsEmail()
  email: string;
}
