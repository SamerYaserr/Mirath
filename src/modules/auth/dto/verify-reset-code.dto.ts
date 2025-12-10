import { ApiProperty, PickType } from '@nestjs/swagger';
import { SignupDto } from './signup.dto';
import { IsNotEmpty, IsString, Length } from 'class-validator';

export class VerifyResetCodeDto extends PickType(SignupDto, ['email']) {
  @ApiProperty({
    description: 'The 6-digit one-time password sent to the email',
    example: '123456',
    minLength: 6,
    maxLength: 6,
  })
  @IsString()
  @IsNotEmpty()
  @Length(6, 6, { message: 'OTP must be exactly 6 digits' })
  otp!: string;
}
