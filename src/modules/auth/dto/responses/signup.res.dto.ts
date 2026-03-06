import { ApiProperty } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';

export class SignupUserResDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'user123' })
  username: string;

  @ApiProperty({ enum: UserStatus, example: UserStatus.PENDING_VERIFICATION })
  status: UserStatus;
}

export class SignupDataResDto {
  @ApiProperty({ type: SignupUserResDto })
  user: SignupUserResDto;

  static fromUser(user: {
    id: string;
    email: string;
    username: string;
    status: UserStatus;
  }): SignupDataResDto {
    const dto = new SignupDataResDto();
    const userDto = new SignupUserResDto();
    userDto.id = user.id;
    userDto.email = user.email;
    userDto.username = user.username;
    userDto.status = user.status;
    dto.user = userDto;
    return dto;
  }
}
