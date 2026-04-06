import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsOptional, IsUUID } from 'class-validator';

import { PaginationDto } from 'src/common/dto/pagination.dto';

export class GetReadingListsQueryReqDto extends PaginationDto {
  @ApiPropertyOptional({
    description:
      "UUID of the user whose reading lists to fetch. If omitted, returns current user's lists.",
    example: '123e4567-e89b-12d3-a456-426614174000',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID('4', { message: 'ownerId must be a valid UUID' })
  ownerId?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true')
  saved?: boolean;
}
