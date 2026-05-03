import { ApiProperty } from '@nestjs/swagger';
import { ChatSession, ChatMessage } from '@prisma/client';

import { SessionResDto } from './session.res.dto';

export class GetUserSessionsResDto extends SessionResDto {
  @ApiProperty({
    description:
      'Preview of the last message in the session, truncated to 80 characters',
    example: 'Hello, how can I help you today...',
  })
  lastMessagePreview: string = '';

  static fromEntity(
    session: ChatSession & { messages?: ChatMessage[] },
  ): GetUserSessionsResDto {
    const { messages, ...rest } = session;

    const dto = Object.assign(
      new GetUserSessionsResDto(),
      SessionResDto.fromEntity(rest as ChatSession),
    );

    const lastMessage = messages?.[0];
    if (lastMessage) {
      dto.lastMessagePreview =
        lastMessage.content.length > 80
          ? lastMessage.content.substring(0, 80) + '...'
          : lastMessage.content;
    }

    return dto;
  }
}
