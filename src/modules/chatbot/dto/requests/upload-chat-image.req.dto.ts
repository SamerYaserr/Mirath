import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';
import { Transform } from 'class-transformer';
import { sanitizeToText } from 'src/common/utils/transform.utils';

export class UploadChatImageReqDto {
  @ApiPropertyOptional({
    description: 'Optional text content to accompany the image',
    example: 'What does this image show?',
    maxLength: 4000,
  })
  @IsOptional()
  @IsString({ message: 'Content must be a string' })
  @MaxLength(4000, { message: 'Content must not exceed 4000 characters' })
  @Transform(sanitizeToText)
  content?: string;
}
