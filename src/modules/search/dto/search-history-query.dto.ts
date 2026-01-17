import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';

export class SearchHistoryQueryDto {
  @ApiPropertyOptional({
    description: 'Maximum number of search history entries to return',
    default: 10,
    example: 10,
    minimum: 1,
    type: Number,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit must be an integer' })
  @Min(1, { message: 'limit must be at least 1' })
  limit: number = 10;
}
