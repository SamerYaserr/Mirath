import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OwnerResDto, ReadingListPaperResDto } from './shared.res.dto';

export class FindOneReadingListResDto {
  @ApiProperty({ example: 'c1a9d9f1-4b21-4b99-8d22-347799777555' })
  id: string;

  @ApiProperty({ example: 'Neural Networks Papers' })
  title: string;

  @ApiPropertyOptional({
    example: 'A collection of must-read neural networks papers.',
  })
  description?: string;

  @ApiProperty({ example: false })
  isPublic: boolean;

  @ApiProperty({ example: 't4gvmte3-pppe-4crf-r333-9qfeqq15q7qq' })
  ownerId: string;

  @ApiProperty({ example: '2026-01-19T18:39:07.379Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-19T18:39:07.379Z' })
  updatedAt: Date;

  @ApiProperty({ type: [ReadingListPaperResDto] })
  papers: ReadingListPaperResDto[];

  @ApiProperty({ type: OwnerResDto })
  owner: OwnerResDto;
}
