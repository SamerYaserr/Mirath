import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';

export enum ChatFileType {
  IMAGE = 'IMAGE',
  AUDIO = 'AUDIO',
}

export class UploadChatFileReqDto {
  @ApiProperty({
    enum: ChatFileType,
    description: 'Type of the file being uploaded',
  })
  @IsEnum(ChatFileType)
  type: ChatFileType;

  @ApiPropertyOptional({
    description:
      'Duration of the audio clip in whole seconds. Required when type = AUDIO.',
    minimum: 1,
    maximum: 600,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(600)
  @Type(() => Number)
  durationSeconds?: number;
}
