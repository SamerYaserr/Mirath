import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateFeedPreferencesReqDto {
  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  showRecommendedPapers?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  hideAlreadyReadPapers?: boolean;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  saveSearchHistory?: boolean;
}
