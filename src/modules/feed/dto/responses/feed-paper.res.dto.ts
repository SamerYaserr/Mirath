import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class FeedPaperResDto {
  @ApiProperty({
    description: 'Unique identifier of the paper',
    example: '3f1e8d6a-9a45-4f2a-8a8a-1b9c9a8e1111',
  })
  id: string;

  @ApiProperty({
    description: 'Title of the paper',
    example: 'Artificial Intelligence in Healthcare',
  })
  title: string;

  @ApiPropertyOptional({
    description: 'Abstract of the paper',
    example:
      'This paper explores the impact of AI in modern healthcare systems.',
  })
  abstract: string | null;

  @ApiProperty({
    description: 'Publication date of the paper',
    example: '2026-01-10T12:00:00.000Z',
  })
  publishedAt: Date;

  @ApiProperty({
    description: 'List of paper authors',
    example: ['John Doe', 'Jane Smith'],
    type: [String],
  })
  authors: string[];

  @ApiProperty({
    description: 'List of paper categories',
    example: ['AI', 'Healthcare'],
    type: [String],
  })
  categories: string[];

  @ApiProperty({
    description: 'Whether the paper is saved by the current user',
    example: true,
  })
  isSaved: boolean;
}
