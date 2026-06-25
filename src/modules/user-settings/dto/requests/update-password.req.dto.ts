import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsString,
  IsStrongPassword,
  Matches,
  MinLength,
} from 'class-validator';

import { Match } from 'src/common/decorators/match.decorator';

export class UpdatePasswordReqDto {
  @ApiProperty({
    description: 'Current password of the user',
    example: 'Nogomba@1',
    format: 'password',
  })
  @IsString({ message: 'Current password must be a string' })
  @IsNotEmpty({ message: 'Current password is required' })
  currentPassword: string;

  @ApiProperty({
    description:
      'New password containing uppercase, lowercase, number, and special character',
    minLength: 8,
    example: 'StrongP@ssw0rd!',
    format: 'password',
  })
  @IsString({ message: 'Password must be a string' })
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password must contain uppercase, lowercase, number and special character',
  })
  @IsStrongPassword({}, { message: 'Password is not strong enough' })
  newPassword: string;

  @ApiProperty({
    description: 'Must match the new password field',
    example: 'StrongP@ssw0rd!',
    format: 'password',
  })
  @IsString({ message: 'Password must be a string' })
  @IsNotEmpty({ message: 'Password is required' })
  @Match('newPassword', {
    message: 'Passwords do not match',
  })
  confirmNewPassword: string;
}
