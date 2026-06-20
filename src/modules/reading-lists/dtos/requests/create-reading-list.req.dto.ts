import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsBoolean,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReadingListReqDto {
  @ApiProperty({
    description: 'Title of the reading list',
    example: 'Machine Learning Favorites',
  })
  @IsString({ message: 'Reading list title must be a string' })
  @IsNotEmpty({ message: 'Reading list title cannot be empty' })
  @MaxLength(100, {
    message: 'Reading list title cannot more than 100 characters',
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the reading list',
    example: 'A collection of papers on ML.',
  })
  @IsString({ message: 'Reading list description must be a string' })
  @MaxLength(500, {
    message: 'Reading list description cannot more than 500 characters',
  })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Visibility of the reading list',
    example: true,
  })
  @IsBoolean({ message: 'isPublic must be boolean' })
  @IsOptional()
  isPublic?: boolean;
}
