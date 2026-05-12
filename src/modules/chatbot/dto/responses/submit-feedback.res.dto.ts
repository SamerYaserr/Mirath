import { ApiProperty } from '@nestjs/swagger';
import { FeedbackType } from '@prisma/client';

export class SubmitFeedbackResDto {
  @ApiProperty({
    description: 'Unique identifier of the message',
    example: '770e8400-e29b-41d4-a716-446655440777',
  })
  messageId: string;

  @ApiProperty({
    description: 'The type of feedback provided',
    enum: FeedbackType,
    example: FeedbackType.THUMBS_UP,
  })
  type: FeedbackType;

  @ApiProperty({
    description: 'Whether the feedback is currently active',
    example: true,
  })
  active: boolean;

  static fromEntity(data: {
    messageId: string;
    type: FeedbackType;
    active: boolean;
  }): SubmitFeedbackResDto {
    return Object.assign(new SubmitFeedbackResDto(), data);
  }
}
