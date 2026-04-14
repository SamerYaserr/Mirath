import { ApiProperty } from '@nestjs/swagger';

export class SearchInPaperResDto {
  @ApiProperty({
    description: 'The search term used for fuzzy matching',
    example: 'neural networks',
  })
  query: string;

  @ApiProperty({
    description: 'The number of matches found in the paper',
    example: 5,
  })
  count: number;

  @ApiProperty({
    description: 'The positions of the matches within the paper content',
    example: [150, 450, 1200],
  })
  positions: number[];
}
