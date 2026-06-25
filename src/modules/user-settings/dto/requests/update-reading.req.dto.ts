import { ApiPropertyOptional } from '@nestjs/swagger';
import { Prisma } from '@prisma/client';
import {
  IsArray,
  IsIn,
  IsNotEmpty,
  IsOptional,
  Matches,
  ArrayMaxSize,
  ValidateIf,
} from 'class-validator';

export class UpdateReadingReqDto {
  @ApiPropertyOptional({ enum: ['PUBLIC', 'PRIVATE'] })
  @IsOptional()
  @IsIn(['PUBLIC', 'PRIVATE'])
  defaultReadingListVisibility?: 'PUBLIC' | 'PRIVATE';

  @ApiPropertyOptional({ type: [String], example: ['#FFDD57', '#48C78E'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10, { message: 'Maximum 10 colors allowed.' })
  @Matches(/^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/, {
    each: true,
    message: 'Each color must be a valid hex code.',
  })
  annotationHighlightColors?: string[];

  @ValidateIf(
    (o) =>
      o.defaultReadingListVisibility === undefined &&
      o.annotationHighlightColors === undefined,
  )
  @IsNotEmpty({ message: 'At least one field must be provided.' })
  _atLeastOne?: never;

  toUpsert(): Omit<Prisma.UserSettingsUncheckedCreateInput, 'id' | 'userId' | 'createdAt' | 'updatedAt'> {
    return {
      ...this,
      ...(this.defaultReadingListVisibility !== undefined && {
        defaultReadingListVisibility:
          this.defaultReadingListVisibility === 'PUBLIC',
      }),
    };
  }
}
