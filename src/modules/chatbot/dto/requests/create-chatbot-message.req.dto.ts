import { MessageType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { IsEnum, IsNotEmpty, IsString, MaxLength } from 'class-validator';

import { sanitizeToText } from 'src/common/utils/transform.utils';

export class CreateChatbotMessageReqDto {
  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content should not be empty' })
  @MaxLength(4000, { message: 'Content must not exceed 4000 characters' })
  @Transform(sanitizeToText)
  content: string;

  @IsEnum(MessageType, { message: 'Type must be a valid MessageType' })
  type?: MessageType = MessageType.TEXT;
}
