import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OwnerResDto } from './shared.res.dto';
import { SystemListSource, UserListSource } from '../../reading-list.types';

export class PaperCountResDto {
  @ApiProperty({ example: 7 })
  papers: number;
}

export class GetAllSystemReadingListsResDto {
  @ApiProperty({ example: '5063158c-b696-4d7f-9737-85fdad1bf7ec' })
  id: string;

  @ApiProperty({ example: 'Biology 101' })
  title: string;

  @ApiPropertyOptional({ example: 'Voluptate ventosus coaegresco.' })
  description: string | null;

  @ApiProperty({ example: false })
  isPublic: boolean;

  @ApiProperty({ example: '8a63a83b-ba57-4388-ab30-e40822e93412' })
  ownerId: string;

  @ApiProperty({ example: '2026-01-28T22:31:13.317Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-28T22:31:13.317Z' })
  updatedAt: Date;

  @ApiProperty({ example: 7 })
  paperCount: number;

  @ApiProperty({
    description: 'The owner of the reading list',
    type: OwnerResDto,
  })
  owner: OwnerResDto;

  static fromList(list: SystemListSource): GetAllSystemReadingListsResDto {
    const dto = new GetAllSystemReadingListsResDto();
    dto.id = list.id;
    dto.title = list.title;
    dto.description = list.description;
    dto.isPublic = list.isPublic;
    dto.ownerId = list.ownerId;
    dto.createdAt = list.createdAt;
    dto.updatedAt = list.updatedAt;
    dto.paperCount = list._count.papers;
    dto.owner = OwnerResDto.fromOwner(list.owner);
    return dto;
  }
}

export class GetUserReadingListsResDto {
  @ApiProperty({ example: 'c1a9d9f1-4b21-4b99-8d22-347799777555' })
  id: string;

  @ApiProperty({ example: 'Neural Networks Papers' })
  title: string;

  @ApiPropertyOptional({
    example: 'A collection of must-read neural networks papers.',
  })
  description: string | null;

  @ApiProperty({ example: true })
  isPublic: boolean;

  @ApiProperty({ example: 't4gvmte3-pppe-4crf-r333-9qfeqq15q7qq' })
  ownerId: string;

  @ApiProperty({ example: '2026-01-19T18:39:07.379Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-19T18:39:07.379Z' })
  updatedAt: Date;

  @ApiProperty({ example: 5 })
  paperCount: number;

  @ApiProperty({ example: ['AI', 'CNN', 'Deep Learning'] })
  previewTags: string[];

  @ApiProperty({ type: OwnerResDto })
  owner: OwnerResDto;

  static fromList(list: UserListSource): GetUserReadingListsResDto {
    const dto = new GetUserReadingListsResDto();
    dto.id = list.id;
    dto.title = list.title;
    dto.description = list.description;
    dto.isPublic = list.isPublic;
    dto.ownerId = list.ownerId;
    dto.createdAt = list.createdAt;
    dto.updatedAt = list.updatedAt;
    dto.paperCount = list._count.papers;
    dto.owner = OwnerResDto.fromOwner(list.owner);

    const allCategories = list.papers.flatMap((p) => p.paper.categories ?? []);
    dto.previewTags = [...new Set(allCategories)].slice(0, 3);

    return dto;
  }
}
