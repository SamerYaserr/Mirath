import {
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  Matches,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordReqDto {
  @ApiProperty({
    description:
      'The token sent to the user to verify the password reset request',
    example: 'd8f9b6a1-2c3d-4e5f-9876-abcdef123456',
  })
  @IsString()
  @IsNotEmpty()
  resetToken!: string;

  @ApiProperty({
    description:
      'New password for the user. Must be strong (include uppercase, lowercase, number, and special character)',
    example: 'StrongP@ssw0rd!',
    format: 'password',
  })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password must contain uppercase, lowercase, number and special character',
  })
  @IsStrongPassword()
  @IsNotEmpty()
  @IsString()
  password!: string;

  @ApiProperty({
    description: 'Must match the password field to confirm the new password',
    example: 'StrongP@ssw0rd!',
    format: 'password',
  })
  @IsStrongPassword()
  @IsNotEmpty()
  @IsString()
  confirmPassword!: string;
}
