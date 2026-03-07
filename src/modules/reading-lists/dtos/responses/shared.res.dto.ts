import { ApiProperty } from '@nestjs/swagger';
import {
  OwnerSource,
  PaperSource,
  ReadingListPaperRecord,
} from '../../reading-list.types';

export class OwnerResDto {
  @ApiProperty({ example: 't4gvmte3-pppe-4crf-r333-9qfeqq15q7qq' })
  id: string;

  @ApiProperty({ example: 'jdoe_research' })
  username: string;

  @ApiProperty({ example: 'John Doe', nullable: true })
  fullName: string | null;

  @ApiProperty({ example: 'https://example.com/avatar.jpg', nullable: true })
  photoUrl: string | null;

  static fromOwner(owner: OwnerSource): OwnerResDto {
    const dto = new OwnerResDto();
    dto.id = owner.id;
    dto.username = owner.username;
    dto.fullName = owner.fullName;
    dto.photoUrl = owner.photoUrl;
    return dto;
  }
}

export class PaperDetailResDto {
  @ApiProperty({ example: 'p1q2r3s4-t5u6-v7w8-x9y0-z1234567890a' })
  id: string;

  @ApiProperty({ example: 'Deep Learning in Neural Networks: An Overview' })
  title: string;

  @ApiProperty({ example: ['J. Schmidhuber'] })
  authors: string[];

  @ApiProperty({
    example: 'This paper provides an overview of deep learning...',
  })
  abstract: string;

  @ApiProperty({ example: ['AI', 'Deep Learning'] })
  categories: string[];

  @ApiProperty({ example: '2025-05-15T00:00:00.000Z' })
  publishedAt: Date;

  @ApiProperty({ example: 'Citation 2025' })
  citation: string;

  static fromPaper(paper: PaperSource): PaperDetailResDto {
    const dto = new PaperDetailResDto();
    dto.id = paper.id;
    dto.title = paper.title;
    dto.authors = paper.authors;
    dto.abstract = paper.abstract;
    dto.categories = paper.categories;
    dto.publishedAt = paper.publishedAt;
    dto.citation = paper.citation;
    return dto;
  }
}

export class ReadingListPaperResDto {
  @ApiProperty({ example: 'c1a9d9f1-4b21-4b99-8d22-347799777555' })
  readingListId: string;

  @ApiProperty({ example: 'p1q2r3s4-t5u6-v7w8-x9y0-z1234567890a' })
  paperId: string;

  @ApiProperty({ type: PaperDetailResDto })
  paper: PaperDetailResDto;

  static fromRecord(record: ReadingListPaperRecord): ReadingListPaperResDto {
    const dto = new ReadingListPaperResDto();
    dto.readingListId = record.readingListId;
    dto.paperId = record.paperId;
    dto.paper = PaperDetailResDto.fromPaper(record.paper);
    return dto;
  }
}
