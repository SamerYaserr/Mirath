import { MessageType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { sanitizeToText } from 'src/common/utils/transform.utils';

export class CreateChatbotMessageReqDto {
  @ApiProperty({
    description: 'Chatbot message content sent by the authenticated user',
    example:
      'Summarize the main contribution of this paper in 3 bullet points.',
    maxLength: 4000,
  })
  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content should not be empty' })
  @MaxLength(4000, { message: 'Content must not exceed 4000 characters' })
  @Transform(sanitizeToText)
  content: string;

  @ApiPropertyOptional({
    description:
      'Optional message type. Defaults to TEXT when omitted. Use IMAGE when an image attachment is included and AUDIO when a voice attachment is included.',
    enum: MessageType,
    default: MessageType.TEXT,
    example: MessageType.TEXT,
  })
  @IsEnum(MessageType, { message: 'Type must be a valid MessageType' })
  type?: MessageType = MessageType.TEXT;
}
