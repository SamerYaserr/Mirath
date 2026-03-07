import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsOptional, IsString, IsUUID, Length } from 'class-validator';
import { sanitizeToText } from 'src/common/utils/transform.utils';

export class CreateCommentDto {
  @ApiProperty({
    description: 'Content of the comment',
    example: 'In my opinion ...',
    type: String,
  })
  @Transform(sanitizeToText)
  @IsString({ message: 'Content must be a string' })
  @Length(10, 10000, {
    message: 'Content must be between 10 and 10000 characters',
  })
  content: string;

  @ApiPropertyOptional({
    description:
      'The id of the parent comment, to support nested comments (replies)',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Topic ID must be a valid UUID' })
  parentId?: string;
}
