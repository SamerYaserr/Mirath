import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Max, Min } from 'class-validator';

export class ChatAudioReqDto {
  @ApiProperty({
    description: 'Duration of the recorded audio clip in whole seconds (1–600)',
    example: 42,
    minimum: 1,
    maximum: 600,
  })
  @Type(() => Number)
  @IsInt({ message: 'durationSeconds must be an integer' })
  @Min(1, { message: 'durationSeconds must be at least 1 second' })
  @Max(600, {
    message: 'durationSeconds must not exceed 600 seconds (10 minutes)',
  })
  durationSeconds: number;
}
