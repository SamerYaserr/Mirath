import { ApiProperty } from '@nestjs/swagger';
import { ReadingHistory, Paper } from '@prisma/client';

export class PaperSummaryDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ example: 'What does it take to solve the measurement problem?' })
  title: string;

  @ApiProperty({ example: ['Jo Henriksson', 'Sabine Hossenfelder'] })
  authors: string[];

  @ApiProperty({ example: ['Quantum Mechanics', 'The Measurement Problem'] })
  categories: string[];

  @ApiProperty({ example: '2022-01-10T00:00:00.000Z' })
  publishedAt: Date;

  @ApiProperty({ example: 'Abstract text...' })
  abstract: string;
}

export class ReadingHistoryResDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  paperId: string;

  @ApiProperty({ example: '2025-07-10T14:22:00.000Z' })
  viewedAt: Date;

  @ApiProperty({ type: PaperSummaryDto })
  paper: PaperSummaryDto;

  static fromEntity(
    entity: ReadingHistory & { paper: Paper },
  ): ReadingHistoryResDto {
    const dto = new ReadingHistoryResDto();
    dto.paperId = entity.paperId;
    dto.viewedAt = entity.viewedAt;
    dto.paper = {
      id: entity.paper.id,
      title: entity.paper.title,
      authors: entity.paper.authors,
      categories: entity.paper.categories,
      publishedAt: entity.paper.publishedAt,
      abstract: entity.paper.abstract,
    };
    return dto;
  }
}
