import {
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  IsEnum,
  IsBoolean,
  IsArray,
  ArrayMaxSize,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { LevelOfEducation } from '@prisma/client';

export class UpdateProfileReqDto {
  @ApiPropertyOptional({ example: 'John Doe', minLength: 2, maxLength: 50 })
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsOptional()
  fullName?: string;

  @ApiPropertyOptional({ example: 'Passionate researcher...' })
  @IsString()
  @MaxLength(500)
  @IsOptional()
  bio?: string;

  @ApiPropertyOptional({ enum: LevelOfEducation })
  @IsEnum(LevelOfEducation)
  @IsOptional()
  levelOfEducation?: LevelOfEducation;

  @ApiPropertyOptional({ example: 'Harvard University' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  university?: string;

  @ApiPropertyOptional({ example: 'Egypt' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  country?: string;

  @ApiPropertyOptional({ description: 'Maps to Keep email private UI toggle' })
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  @IsOptional()
  keepEmailPrivate?: boolean;

  @ApiPropertyOptional({ type: [String] })
  @Transform(({ value }) => {
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') return value.split(',').map((i) => i.trim());
    return value;
  })
  @IsArray()
  @ArrayMaxSize(10)
  @IsString({ each: true })
  @IsOptional()
  interests?: string[];
}
