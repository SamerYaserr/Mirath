import { ApiProperty } from '@nestjs/swagger';

export class SavedPapersResDto {
  @ApiProperty({
    description: 'The ID of the user who saved the paper',
    example: 'user-id-123',
  })
  userId: string;

  @ApiProperty({
    description: 'The ID of the saved paper',
    example: 'paper-id-1',
  })
  paperId: string;

  @ApiProperty({
    description: 'Timestamp when the paper was saved',
    example: '2025-12-10T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'The paper details',
    type: 'object',
    properties: {
      id: { type: 'string', example: 'paper-id-1' },
      title: { type: 'string', example: 'Sample Paper' },
      abstract: { type: 'string', example: 'Paper abstract...' },
      authors: {
        type: 'array',
        items: { type: 'string' },
        example: ['John Smith', 'Jane Doe'],
      },
      publishedAt: {
        type: 'string',
        format: 'date-time',
        example: '2025-01-15T00:00:00.000Z',
      },
      categories: {
        type: 'array',
        items: { type: 'string' },
        example: ['Computer Science', 'Artificial Intelligence'],
      },
    },
  })
  paper: Record<string, unknown>;

  static fromEntity(savedPaper: Record<string, any>): SavedPapersResDto {
    const dto = new SavedPapersResDto();
    dto.userId = savedPaper.userId;
    dto.paperId = savedPaper.paperId;
    dto.createdAt = savedPaper.createdAt;
    dto.paper = {
      id: savedPaper.paper.id,
      title: savedPaper.paper.title,
      abstract:
        savedPaper.paper.abstract.length > 200
          ? savedPaper.paper.abstract.substring(0, 200) + '...'
          : savedPaper.paper.abstract,
      authors: savedPaper.paper.authors,
      publishedAt: savedPaper.paper.publishedAt,
      categories: savedPaper.paper.categories,
    };
    return dto;
  }
}
