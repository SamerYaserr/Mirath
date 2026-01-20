import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional, IsUUID, Max, Min } from 'class-validator';

export enum SortType {
  NEW = 'new',
  TOP = 'top',
}

export class GetDiscussionsDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    default: 1,
    minimum: 1,
    example: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Page must be an integer' })
  @Min(1, { message: 'Page must be at least 1' })
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'Limit must be an integer' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit cannot exceed 100' })
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Sort order by creation date or vote score',
    enum: SortType,
    default: SortType.NEW,
    example: SortType.NEW,
  })
  @IsOptional()
  @IsEnum(SortType, { message: 'Sort must be either new or top' })
  sort?: SortType = SortType.NEW;

  @ApiPropertyOptional({
    description: 'Topic id to search by',
    example: '550e8400-e29b-41d4-a716-446655440000',
    type: String,
  })
  @IsOptional()
  @IsUUID('4', { message: 'Topic ID must be a valid UUID' })
  topicId?: string;
}
