import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  AttachmentType,
  ChatMessage,
  FeedbackType,
  MessageAttachment,
  MessageFeedback,
  MessageRole,
  MessageType,
} from '@prisma/client';

type ChatbotMessageAttachmentEntity = Pick<
  MessageAttachment,
  | 'id'
  | 'type'
  | 'url'
  | 'mimeType'
  | 'sizeBytes'
  | 'durationSeconds'
  | 'createdAt'
>;

type ChatbotMessageFeedbackEntity = Pick<
  MessageFeedback,
  'id' | 'type' | 'createdAt' | 'updatedAt'
>;

type ChatbotMessageEntity = Pick<
  ChatMessage,
  'id' | 'role' | 'type' | 'content' | 'createdAt'
> & {
  attachments: ChatbotMessageAttachmentEntity[];
  feedback: ChatbotMessageFeedbackEntity | null;
};

export class ChatbotMessageAttachmentResDto {
  @ApiProperty({
    description: 'Unique identifier of the attachment',
    example: '770e8400-e29b-41d4-a716-446655440777',
  })
  id: string;

  @ApiProperty({
    description: 'Attachment type',
    enum: AttachmentType,
    example: AttachmentType.IMAGE,
  })
  type: AttachmentType;

  @ApiProperty({
    description: 'Public URL of the attachment',
    example: 'https://cdn.example.com/uploads/image.png',
  })
  url: string;

  @ApiProperty({
    description: 'MIME type of the attachment',
    example: 'image/png',
  })
  mimeType: string;

  @ApiProperty({
    description: 'Attachment size in bytes',
    example: 245760,
  })
  sizeBytes: number;

  @ApiPropertyOptional({
    description: 'Audio duration in seconds, when applicable',
    nullable: true,
    example: null,
  })
  durationSeconds: number | null;

  @ApiProperty({
    description: 'Attachment creation date',
    example: '2026-01-15T12:00:00.000Z',
  })
  createdAt: Date;

  static fromEntity(
    attachment: ChatbotMessageAttachmentEntity,
  ): ChatbotMessageAttachmentResDto {
    const dto = new ChatbotMessageAttachmentResDto();

    dto.id = attachment.id;
    dto.type = attachment.type;
    dto.url = attachment.url;
    dto.mimeType = attachment.mimeType;
    dto.sizeBytes = attachment.sizeBytes;
    dto.durationSeconds = attachment.durationSeconds;
    dto.createdAt = attachment.createdAt;

    return dto;
  }
}

export class ChatbotMessageFeedbackResDto {
  @ApiProperty({
    description: 'Unique identifier of the feedback entry',
    example: '770e8400-e29b-41d4-a716-446655440888',
  })
  id: string;

  @ApiProperty({
    description: 'Feedback type',
    enum: FeedbackType,
    example: FeedbackType.THUMBS_UP,
  })
  type: FeedbackType;

  @ApiProperty({
    description: 'Feedback creation date',
    example: '2026-01-15T12:05:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Feedback last update date',
    example: '2026-01-15T12:06:00.000Z',
  })
  updatedAt: Date;

  static fromEntity(
    feedback: ChatbotMessageFeedbackEntity,
  ): ChatbotMessageFeedbackResDto {
    const dto = new ChatbotMessageFeedbackResDto();

    dto.id = feedback.id;
    dto.type = feedback.type;
    dto.createdAt = feedback.createdAt;
    dto.updatedAt = feedback.updatedAt;

    return dto;
  }
}

export class ChatbotMessageResDto {
  @ApiProperty({
    description: 'Unique identifier of the message',
    example: '770e8400-e29b-41d4-a716-446655440999',
  })
  id: string;

  @ApiProperty({
    description: 'Who sent the message',
    enum: MessageRole,
    example: MessageRole.USER,
  })
  role: MessageRole;

  @ApiProperty({
    description: 'Message type',
    enum: MessageType,
    example: MessageType.TEXT,
  })
  type: MessageType;

  @ApiProperty({
    description: 'Message content',
    example: 'Can you summarize this paper for me?',
  })
  content: string;

  @ApiProperty({
    description: 'Message attachments',
    type: [ChatbotMessageAttachmentResDto],
  })
  attachments: ChatbotMessageAttachmentResDto[];

  @ApiPropertyOptional({
    description: 'User feedback for the message',
    type: ChatbotMessageFeedbackResDto,
    nullable: true,
  })
  feedback: ChatbotMessageFeedbackResDto | null;

  @ApiProperty({
    description: 'Message creation date',
    example: '2026-01-15T12:00:00.000Z',
  })
  createdAt: Date;

  static fromEntity(message: ChatbotMessageEntity): ChatbotMessageResDto {
    const dto = new ChatbotMessageResDto();

    dto.id = message.id;
    dto.role = message.role;
    dto.type = message.type;
    dto.content = message.content;
    dto.attachments = message.attachments.map((attachment) =>
      ChatbotMessageAttachmentResDto.fromEntity(attachment),
    );
    dto.feedback = message.feedback
      ? ChatbotMessageFeedbackResDto.fromEntity(message.feedback)
      : null;
    dto.createdAt = message.createdAt;

    return dto;
  }
}
