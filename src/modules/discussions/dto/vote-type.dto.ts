import { IsEnum } from 'class-validator';
import { VoteType } from '@prisma/client';
import { Transform } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class VoteTypeDto {
  @ApiPropertyOptional({
    description: 'Type of vote. Up or Down',
    enum: VoteType,
    example: VoteType.UP,
  })
  @Transform(({ value }) => value?.toUpperCase())
  @IsEnum(VoteType, { message: 'Vote type must be either up or down' })
  type: VoteType;
}
