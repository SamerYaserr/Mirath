import { ApiProperty } from '@nestjs/swagger';

export class TopicResDto {
  @ApiProperty({
    description: 'Unique identifier of the topic',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the topic',
    example: 'Machine Learning',
  })
  name: string;

  @ApiProperty({
    description: 'Whether the topic was user-created',
    example: false,
  })
  custom: boolean;
}
