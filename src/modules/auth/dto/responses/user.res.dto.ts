import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UserStatus } from '@prisma/client';
import { AuthUserPayload } from '../../auth.types';

export class UserResDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'user@example.com' })
  email: string;

  @ApiProperty({ example: 'user123' })
  username: string;

  @ApiPropertyOptional({ example: 'https://example.com/photo.jpg' })
  photoUrl?: string | null;

  @ApiProperty({ enum: UserStatus, example: UserStatus.ACTIVE })
  status: UserStatus;

  static fromPayload(payload: AuthUserPayload): UserResDto {
    const dto = new UserResDto();
    dto.id = payload.id;
    dto.email = payload.email;
    dto.username = payload.username;
    dto.photoUrl = payload.photoUrl;
    dto.status = payload.status;
    return dto;
  }
}
