import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @ApiProperty({
    description: "user's email address or username",
    example: 'student@university.edu',
  })
  @IsString()
  @IsNotEmpty()
  emailOrUsername!: string;

  @ApiProperty({
    description: "user's account password",
    example: 'StrongP@ssw0rd!',
  })
  @IsString()
  @IsNotEmpty()
  password!: string;
}
