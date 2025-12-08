import { IsNotEmpty, IsString, IsStrongPassword } from 'class-validator';

export class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  resetToken!: string;

  @IsStrongPassword()
  @IsNotEmpty()
  @IsString()
  password!: string;

  @IsStrongPassword()
  @IsNotEmpty()
  @IsString()
  confirmPassword!: string;
}
