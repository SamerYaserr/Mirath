import { ColorMode, FontSize } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, ValidateIf } from 'class-validator';

export class UpdateDisplayReqDto {
  @ApiPropertyOptional({ enum: ColorMode })
  @IsOptional()
  @IsEnum(ColorMode)
  colorMode?: ColorMode;

  @ApiPropertyOptional({ enum: FontSize })
  @IsOptional()
  @IsEnum(FontSize)
  defaultFontSize?: FontSize;

  @ValidateIf(
    (o) => o.colorMode === undefined && o.defaultFontSize === undefined,
  )
  @IsNotEmpty({ message: 'At least one field must be provided.' })
  _atLeastOne?: never;
}
