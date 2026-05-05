import { MessageType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBase64,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

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

  @ApiPropertyOptional({
    description:
      'Optional base64-encoded image attachment associated with the message. Include this when sending an image to the assistant.',
    example: 'iVBORw0KGgoAAAANSUhEUgAA...',
  })
  @IsOptional()
  @IsBase64({}, { message: 'File must be a valid base64 string' })
  image?: string | undefined;

  @ApiPropertyOptional({
    description:
      'Optional base64-encoded voice attachment associated with the message. Include this when sending a voice note to the assistant.',
    example: 'SUQzAwAAAAAAQVRJT...',
  })
  @IsOptional()
  @IsBase64({}, { message: 'Voice must be a valid base64 string' })
  voice?: string | undefined;

  @ApiPropertyOptional({
    description:
      'Voice note duration in seconds. Provide this together with the voice attachment.',
    example: 12.8,
  })
  @IsNumber({}, { message: 'Voice duration must be a number' })
  @IsOptional()
  voiceDuration?: number;
}
