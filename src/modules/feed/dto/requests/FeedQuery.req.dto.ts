import { IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

import { RecommendationQueryDto } from './RecommendationQuery.req.dto';

export class FeedQueryDto extends RecommendationQueryDto {
  @ApiPropertyOptional({
    description: 'Category to filter papers by',
    default: undefined,
    example: 'Computer Science',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  category?: string;
}
