import { ApiProperty } from '@nestjs/swagger';
import { FeedbackType } from '@prisma/client';
import { IsEnum, IsUUID } from 'class-validator';

export class SubmitFeedbackReqBodyDto {
  @ApiProperty({
    description:
      'Feedback type an authenticated user can add (THUMBS_UP | THUMBS_DOWN)',
    enum: FeedbackType,
    example: FeedbackType.THUMBS_UP,
  })
  @IsEnum(FeedbackType, {
    message: 'feedbackType must be a valid FeedbackType',
  })
  feedbackType: FeedbackType;
}

export class SubmitFeedbackReqParamsDto {
  @ApiProperty({
    description: 'Unique identifier of the message',
    example: '770e8400-e29b-41d4-a716-446655440777',
    type: String,
  })
  @IsUUID('4', { message: 'Message ID must be a valid UUID' })
  messageId: string;

  @ApiProperty({
    description: 'Unique identifier of the message',
    example: '770e8400-e29b-41d4-a716-446655440777',
    type: String,
  })
  @IsUUID('4', { message: 'Session ID must be a valid UUID' })
  sessionId: string;
}
