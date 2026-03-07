import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsNotEmpty } from 'class-validator';

export class CheckVerificationReqDto {
  @ApiProperty({
    description: 'The email address to check verification status for',
    example: 'student@university.edu',
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;
}
