import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { HighlightColor } from '@prisma/client';

export class CreateHighlightReqDto {
  @ApiPropertyOptional({
    description: 'Highlight color',
    enum: HighlightColor,
    default: HighlightColor.YELLOW,
  })
  @IsEnum(HighlightColor)
  @IsOptional()
  color?: HighlightColor = HighlightColor.YELLOW;

  @ApiPropertyOptional({ description: 'Optional note attached to the highlight' })
  @IsString()
  @IsOptional()
  @MaxLength(5000)
  note?: string;

  // Primary XPath restoration fields

  @ApiProperty({ description: 'XPath to the start node', example: '/html/body/article/section[1]/p[3]/text()[1]' })
  @IsString()
  @IsNotEmpty()
  xpathStart: string;

  @ApiProperty({ description: 'XPath to the end node', example: '/html/body/article/section[1]/p[3]/b[1]/text()[1]' })
  @IsString()
  @IsNotEmpty()
  xpathEnd: string;

  @ApiProperty({ description: 'Character offset within start node', example: 8 })
  @IsInt()
  @Min(0)
  startOffset: number;

  @ApiProperty({ description: 'Character offset within end node', example: 17 })
  @IsInt()
  @Min(0)
  endOffset: number;

  // Text restoration fields

  @ApiProperty({ description: 'The raw selected text', example: 'some text' })
  @IsString()
  @IsNotEmpty()
  selectedText: string;

  @ApiPropertyOptional({ description: 'Plain-text version of the selection' })
  @IsString()
  @IsOptional()
  plainText?: string;

  @ApiPropertyOptional({ description: 'HTML content of the selection (max 50 000 chars)' })
  @IsString()
  @IsOptional()
  @MaxLength(50_000)
  htmlContent?: string;

  // Context metadata (for disambiguation)

  @ApiPropertyOptional({ description: 'Text immediately before the selection (max 500 chars)' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  contextBefore?: string;

  @ApiPropertyOptional({ description: 'Text immediately after the selection (max 500 chars)' })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  contextAfter?: string;

  @ApiPropertyOptional({ description: 'First word of the selection' })
  @IsString()
  @IsOptional()
  firstWord?: string;

  @ApiPropertyOptional({ description: 'Last word of the selection' })
  @IsString()
  @IsOptional()
  lastWord?: string;

  @ApiPropertyOptional({ description: 'Word count of the selection', example: 2 })
  @IsInt()
  @Min(0)
  @IsOptional()
  selectedWordCount?: number;

  @ApiPropertyOptional({ description: 'Character length of the selection', example: 9 })
  @IsInt()
  @Min(0)
  @IsOptional()
  selectedCharLength?: number;
}
