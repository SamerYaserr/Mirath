import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AttachmentType } from '@prisma/client';

export class ChatFileResDto {
  @ApiProperty({
    description: 'Unique identifier for the file',
    example: 'file-id-123',
  })
  id: string;

  @ApiProperty({
    enum: AttachmentType,
    description: 'Type of the file',
    example: AttachmentType.IMAGE,
  })
  type: AttachmentType;

  @ApiProperty({
    description: 'URL of the file',
    example: 'https://example.com/file.jpg',
  })
  url: string;

  @ApiProperty({ description: 'MIME type of the file', example: 'image/jpeg' })
  mimeType: string;

  @ApiProperty({ description: 'Size of the file in bytes', example: 1024 })
  sizeBytes: number;

  @ApiPropertyOptional({
    description: 'Duration of the audio clip in whole seconds',
    example: 30,
  })
  durationSeconds: number | null;

  static fromEntity(entity: {
    id: string;
    type: AttachmentType;
    url: string;
    mimeType: string;
    sizeBytes: number;
    durationSeconds: number | null;
  }): ChatFileResDto {
    const dto = new ChatFileResDto();
    dto.id = entity.id;
    dto.type = entity.type;
    dto.url = entity.url;
    dto.mimeType = entity.mimeType;
    dto.sizeBytes = entity.sizeBytes;
    dto.durationSeconds = entity.durationSeconds;
    return dto;
  }
}
