import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OwnerResDto, ReadingListPaperResDto } from './shared.res.dto';
import { FindOneListSource } from '../../reading-list.types';

export class FindOneReadingListResDto {
  @ApiProperty({ example: 'c1a9d9f1-4b21-4b99-8d22-347799777555' })
  id: string;

  @ApiProperty({ example: 'Neural Networks Papers' })
  title: string;

  @ApiPropertyOptional({
    example: 'A collection of must-read neural networks papers.',
  })
  description: string | null;

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

  static fromList(list: FindOneListSource): FindOneReadingListResDto {
    const dto = new FindOneReadingListResDto();
    dto.id = list.id;
    dto.title = list.title;
    dto.description = list.description;
    dto.isPublic = list.isPublic;
    dto.ownerId = list.ownerId;
    dto.createdAt = list.createdAt;
    dto.updatedAt = list.updatedAt;
    dto.papers = list.papers.map(ReadingListPaperResDto.fromRecord);
    dto.owner = OwnerResDto.fromOwner(list.owner);
    return dto;
  }
}
