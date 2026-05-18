import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class AiServiceReqDto {
  @ApiProperty({
    description:
      'The text selected by the user in the paper reader. ' +
      'This is the input that will be processed by the requested AI service.',
    example:
      'The Transformer model replaces recurrence entirely with an attention ' +
      'mechanism, allowing for significantly more parallelisation.',
    maxLength: 10_000,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(10_000)
  selectedText: string;
}
