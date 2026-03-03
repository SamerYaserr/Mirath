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
    },
  })
  paper: Record<string, unknown>;

  static fromEntity(entity: Record<string, any>): SavedPapersResDto {
    const dto = new SavedPapersResDto();
    dto.userId = entity.userId;
    dto.paperId = entity.paperId;
    dto.createdAt = entity.createdAt;
    dto.paper = entity.paper;
    return dto;
  }
}
