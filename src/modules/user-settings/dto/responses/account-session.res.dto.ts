import { ApiProperty } from '@nestjs/swagger';
import { RefreshToken } from '@prisma/client';

export class AccountSessionResDto {
  @ApiProperty({
    description: 'Unique session identifier',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  sessionId: string;

  @ApiProperty({
    description: 'Timestamp when the session was created',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the session expires',
    example: '2024-01-22T10:30:00.000Z',
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'Whether this session is the current one',
    example: true,
  })
  isCurrent: boolean;

  static fromEntity(
    entity: RefreshToken,
    isCurrent: boolean,
  ): AccountSessionResDto {
    const dto = new AccountSessionResDto();

    dto.sessionId = entity.sessionId;
    dto.createdAt = entity.createdAt;
    dto.expiresAt = entity.expiresAt;
    dto.isCurrent = isCurrent;

    return dto;
  }
}
