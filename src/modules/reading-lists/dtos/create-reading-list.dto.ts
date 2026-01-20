import { IsString, IsNotEmpty, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateReadingListDto {
  @ApiProperty({
    description: 'Title of the reading list',
    example: 'Machine Learning Favorites',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiPropertyOptional({
    description: 'Description of the reading list',
    example: 'A collection of papers on ML.',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Visibility of the reading list',
    default: true,
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean = true;
}
