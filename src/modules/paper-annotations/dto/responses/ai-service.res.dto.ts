import { ApiProperty } from '@nestjs/swagger';

export class AiServiceResDto {
  @ApiProperty({
    description: 'The AI-generated response for the requested service action.',
    example:
      'The passage introduces the Transformer architecture, which relies ' +
      'solely on attention mechanisms — dispensing with recurrence and ' +
      'convolutions entirely to achieve faster training and better results.',
  })
  answer: string;

  static fromAnswer(answer: string): AiServiceResDto {
    const dto = new AiServiceResDto();
    dto.answer = answer;
    return dto;
  }
}
