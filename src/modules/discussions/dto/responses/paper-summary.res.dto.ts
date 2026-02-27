import { ApiProperty } from '@nestjs/swagger';

export class PaperSummaryResDto {
  @ApiProperty({
    description: 'Unique identifier of the paper',
    example: '770e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'List of paper authors',
    type: [String],
    example: ['Alice Smith', 'Bob Johnson'],
  })
  authors: string[];

  @ApiProperty({
    description: 'Title of the paper',
    example: 'Advancements in AI',
  })
  title: string;

  @ApiProperty({
    description: 'Abstract of the paper',
    example: 'This paper discusses recent advancements in AI...',
  })
  abstract: string;
}
