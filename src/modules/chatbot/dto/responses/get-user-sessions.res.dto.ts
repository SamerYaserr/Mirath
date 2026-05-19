import { ApiProperty } from '@nestjs/swagger';
import { ChatSession, ChatMessage } from '@prisma/client';

export class GetUserSessionsResDto {
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
    description: 'ID of the user this session belongs to',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  userId: string;

  @ApiProperty({
    description: 'Session creation date',
    example: '2026-01-15T12:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Session last update date',
    example: '2026-01-15T12:00:00.000Z',
  })
  updatedAt: Date;

  @ApiProperty({
    description:
      'Preview of the last message in the session, truncated to 80 characters',
    example: 'Hello, how can I help you today...',
  })
  lastMessagePreview: string = '';

  static fromEntity(
    session: ChatSession & { messages?: ChatMessage[] },
  ): GetUserSessionsResDto {
    const dto = new GetUserSessionsResDto();

    dto.id = session.id;
    dto.title = session.title;
    dto.userId = session.userId;
    dto.createdAt = session.createdAt;
    dto.updatedAt = session.updatedAt;

    const lastMessage = session.messages?.[0];
    if (lastMessage) {
      dto.lastMessagePreview =
        lastMessage.content.length > 80
          ? lastMessage.content.substring(0, 80) + '...'
          : lastMessage.content;
    }

    return dto;
  }
}
