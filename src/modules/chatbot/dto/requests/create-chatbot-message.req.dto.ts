import { MessageType } from '@prisma/client';
import { Transform } from 'class-transformer';
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
  @IsString({ message: 'Content must be a string' })
  @IsNotEmpty({ message: 'Content should not be empty' })
  @MaxLength(4000, { message: 'Content must not exceed 4000 characters' })
  @Transform(sanitizeToText)
  content: string;

  @IsEnum(MessageType, { message: 'Type must be a valid MessageType' })
  type?: MessageType = MessageType.TEXT;

  @IsOptional()
  @IsBase64({}, { message: 'File must be a valid base64 string' })
  image?: string | undefined;

  @IsOptional()
  @IsBase64({}, { message: 'Voice must be a valid base64 string' })
  voice?: string | undefined;

  @IsNumber({}, { message: 'Voice duration must be a number' })
  @IsOptional()
  voiceDuration?: number;
}
