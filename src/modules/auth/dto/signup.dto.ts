import {
  IsEmail,
  IsNotEmpty,
  IsString,
  MinLength,
  Matches,
  NotContains,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class SignupDto {
  @ApiProperty({
    description: 'The unique email address of the user',
    example: 'student@university.edu',
  })
  @IsEmail()
  email!: string;

  @ApiProperty({
    description: 'The unique username. Cannot contain "@" symbol.',
    example: 'john_doe_99',
  })
  @IsString()
  @IsNotEmpty()
  @NotContains('@', {
    message:
      'Username cannot contain the "@" symbol. This is reserved for emails.',
  })
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message:
      'Username can only contain letters, numbers, underscores, dots, and hyphens',
  })
  username!: string;

  @ApiProperty({
    description:
      'Password containing uppercase, lowercase, number, and special character',
    minLength: 8,
    example: 'StrongP@ssw0rd!',
    format: 'password',
  })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters long' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message:
      'Password must contain uppercase, lowercase, number and special character',
  })
  password!: string;

  @ApiProperty({
    description: 'Must match the password field',
    example: 'StrongP@ssw0rd!',
    format: 'password',
  })
  @IsString()
  @IsNotEmpty()
  confirmPassword!: string;
}
