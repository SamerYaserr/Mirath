import { ApiProperty } from '@nestjs/swagger';

export class SavedPapersResDto {
  @ApiProperty({
    description: 'Saved paper record UUID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

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
}
