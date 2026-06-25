import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches, NotContains } from 'class-validator';

export class ChangeUsernameReqDto {
  @ApiProperty({
    description: 'The unique username. Cannot contain "@" symbol.',
    example: 'john_doe_99',
  })
  @IsString({ message: 'Username must be a string' })
  @IsNotEmpty({ message: 'Username cannot be empty' })
  @NotContains('@', {
    message:
      'Username cannot contain the "@" symbol. This is reserved for emails.',
  })
  @Matches(/^[a-zA-Z0-9._-]+$/, {
    message:
      'Username can only contain letters, numbers, underscores, dots, and hyphens',
  })
  newUsername: string;
}
