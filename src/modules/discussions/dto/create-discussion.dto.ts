import {
  ArrayMaxSize,
  ArrayNotEmpty,
  IsArray,
  IsString,
  IsUUID,
  Length,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import {
  removeDuplicates,
  sanitizeToText,
} from 'src/common/utils/transform.utils';

export class CreateDiscussionDto {
  @ApiProperty({
    description: 'String defining title of the discussion',
    example: 'Best practices for implementing ...',
    type: String,
  })
  @Transform(sanitizeToText)
  @IsString({ message: 'Title must be a string' })
  @Length(3, 150, { message: 'Title must be between 3 and 150 characters' })
  title: string;

  @ApiProperty({
    description: 'Content of the discussion',
    example: 'I am currently working on ...',
    type: String,
  })
  @Transform(sanitizeToText)
  @IsString({ message: 'Content must be a string' })
  @Length(10, 10000, {
    message: 'Content must be between 10 and 10000 characters',
  })
  content: string;

  @ApiProperty({
    description: 'Array of topic IDs in UUID format',
    example: [
      '550e8400-e29b-41d4-a716-446655440000',
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    ],
    type: [String],
    isArray: true,
  })
  @Transform(removeDuplicates)
  @IsArray({ message: 'Topic Ids must be an array' })
  @ArrayNotEmpty({ message: 'Topic Ids array cannot be empty' })
  @ArrayMaxSize(5, { message: 'Maximum 5 topics allowed' })
  @IsUUID('4', { each: true, message: 'Each topic ID must be a valid UUID' })
  topicIds: string[];

  @ApiPropertyOptional({
    description: 'StriArray of paper IDs in UUID format',
    example: [
      '550e8400-e29b-41d4-a716-446655440000',
      '6ba7b810-9dad-11d1-80b4-00c04fd430c8',
    ],
    type: [String],
    isArray: true,
  })
  @Transform(removeDuplicates)
  @IsArray({ message: 'Topic Ids must be an array' })
  @ArrayMaxSize(3, { message: 'Maximum 3 papers allowed' })
  @IsUUID('4', { each: true, message: 'Each paper ID must be a valid UUID' })
  paperIds?: string[];
}
