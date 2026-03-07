import { ApiProperty } from '@nestjs/swagger';
import { SavedPaper } from '@prisma/client';

export class SavedPaperResDto {
  @ApiProperty({
    description: 'Saved paper record UUID',
    example: 'a1b2c3d4-e5f6-7890-abcd-ef1234567890',
  })
  id: string;

  @ApiProperty({
    description: 'The ID of the user who saved the paper',
    example: 'user-id-456',
  })
  userId: string;

  @ApiProperty({
    description: 'The ID of the saved paper',
    example: 'paper-id-123',
  })
  paperId: string;

  @ApiProperty({
    description: 'Timestamp when the paper was saved',
    example: '2025-12-10T10:30:00.000Z',
  })
  createdAt: Date;

  static fromEntity(savedPaper: SavedPaper): SavedPaperResDto {
    const dto = new SavedPaperResDto();
    dto.userId = savedPaper.userId;
    dto.paperId = savedPaper.paperId;
    dto.createdAt = savedPaper.createdAt;
    return dto;
  }
}
