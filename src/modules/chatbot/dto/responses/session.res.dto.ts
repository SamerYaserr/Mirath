import { ApiProperty } from '@nestjs/swagger';
import { ChatSession } from '@prisma/client';

export class SessionResDto {
  @ApiProperty({
    description: 'Unique identifier of the session',
    example: '770e8400-e29b-41d4-a716-446655440777',
  })
  id: string;

  @ApiProperty({
    description: 'Title of the chat session',
    example: 'New Chat',
  })
  title: string;

  @ApiProperty({
    description: 'ID of the user this chat session belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  userId: string;

  @ApiProperty({
    description: 'Determines if the chat session is temporary',
    default: false,
  })
  isTemporary: boolean;

  @ApiProperty({
    description: 'Chat session creation date',
    example: '2024-01-15T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Chat session last update date',
    example: '2024-01-15T12:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description: 'Chat session expiration date, if temporary',
    example: '2024-01-15T12:00:00.000Z',
  })
  expiresAt: Date;

  static fromEntity(session: ChatSession): SessionResDto {
    return Object.assign(new SessionResDto(), {
      ...session,
    });
  }
}
