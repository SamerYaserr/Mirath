import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { OwnerResDto } from './shared.res.dto';

export class PaperCountResDto {
  @ApiProperty({ example: 7 })
  papers: number;
}

export class GetAllReadingListAdminResDto {
  @ApiProperty({ example: '5063158c-b696-4d7f-9737-85fdad1bf7ec' })
  id: string;

  @ApiProperty({ example: 'Biology 101' })
  title: string;

  @ApiPropertyOptional({ example: 'Voluptate ventosus coaegresco.' })
  description?: string;

  @ApiProperty({ example: false })
  isPublic: boolean;

  @ApiProperty({ example: '8a63a83b-ba57-4388-ab30-e40822e93412' })
  ownerId: string;

  @ApiProperty({ example: '2026-01-28T22:31:13.317Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-28T22:31:13.317Z' })
  updatedAt: Date;

  @ApiProperty({
    description: 'The number of papers in the reading list',
    type: PaperCountResDto,
  })
  _count: PaperCountResDto;

  @ApiProperty({
    description: 'The owner of the reading list',
    type: OwnerResDto,
  })
  owner: OwnerResDto;
}

export class GetAllReadingListResDto {
  @ApiProperty({ example: 'c1a9d9f1-4b21-4b99-8d22-347799777555' })
  id: string;

  @ApiProperty({ example: 'Neural Networks Papers' })
  title: string;

  @ApiPropertyOptional({
    example: 'A collection of must-read neural networks papers.',
  })
  description?: string;

  @ApiProperty({ example: true })
  isPublic: boolean;

  @ApiProperty({ example: 't4gvmte3-pppe-4crf-r333-9qfeqq15q7qq' })
  ownerId: string;

  @ApiProperty({ example: '2026-01-19T18:39:07.379Z' })
  createdAt: Date;

  @ApiProperty({ example: '2026-01-19T18:39:07.379Z' })
  updatedAt: Date;

  @ApiProperty({
    description: 'The number of papers in the reading list',
    type: PaperCountResDto,
  })
  _count: PaperCountResDto;

  @ApiProperty({ example: ['AI', 'CNN', 'Deep Learning'] })
  previewTags: string[];

  @ApiProperty({ type: OwnerResDto })
  owner: OwnerResDto;
}
