import { ApiProperty } from '@nestjs/swagger';
import { ChatSession } from '@prisma/client';

export class TemporarySessionResDto {
  @ApiProperty({
    description: 'Unique identifier of the temporary session',
    example: '770e8400-e29b-41d4-a716-446655440777',
  })
  id: string;

  @ApiProperty({
    description:
      'Session title — always "Temporary Chat" for temporary sessions',
    example: 'Temporary Chat',
  })
  title: string;

  @ApiProperty({
    description: 'Always true for temporary sessions',
    example: true,
  })
  isTemporary: boolean;

  @ApiProperty({
    description:
      'UTC timestamp after which the session is eligible for automatic cleanup. ' +
      'Reset to NOW() + 24h on every new message.',
    example: '2026-01-16T12:00:00.000Z',
  })
  expiresAt: Date;

  @ApiProperty({
    description: 'Session creation timestamp',
    example: '2026-01-15T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Session last-updated timestamp',
    example: '2026-01-15T12:00:00.000Z',
  })
  updatedAt: Date;

  static fromEntity(session: ChatSession): TemporarySessionResDto {
    const dto = new TemporarySessionResDto();
    dto.id = session.id;
    dto.title = session.title;
    dto.isTemporary = session.isTemporary;
    dto.expiresAt = session.expiresAt!;
    dto.createdAt = session.createdAt;
    dto.updatedAt = session.updatedAt;
    return dto;
  }
}
