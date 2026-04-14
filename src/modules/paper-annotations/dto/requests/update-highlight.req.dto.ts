import { IsEnum, IsOptional } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { HighlightColor } from '@prisma/client';

export class UpdateHighlightReqDto {
  @ApiPropertyOptional({
    description: 'New highlight color',
    enum: HighlightColor,
  })
  @IsEnum(HighlightColor)
  @IsOptional()
  color?: HighlightColor;
}
