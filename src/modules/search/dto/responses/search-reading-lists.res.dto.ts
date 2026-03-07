import { ApiProperty } from '@nestjs/swagger';
import { SearchUserResDto } from './shared.res.dto';
import { ReadingListResult } from '../../search.types';

export class ReadingListSearchResDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174002' })
  id: string;

  @ApiProperty({ example: 'Essential NLP Papers' })
  title: string;

  @ApiProperty({ example: '2024-01-19T10:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: 12 })
  paperCount: number;

  @ApiProperty({ example: true })
  isSaved: boolean;

  @ApiProperty({ type: SearchUserResDto })
  owner: SearchUserResDto;

  @ApiProperty({
    example:
      'A curated list of must-read papers in natural language processing.',
  })
  description: string | null;

  @ApiProperty({ example: false })
  isPublic: boolean;

  @ApiProperty({ example: '2024-01-15T08:00:00.000Z' })
  createdAt: Date;

  static fromResult(
    result: ReadingListResult,
    currentUserId: string,
  ): ReadingListSearchResDto {
    const dto = new ReadingListSearchResDto();
    dto.id = result.id;
    dto.title = result.title;
    dto.updatedAt = result.updatedAt;
    dto.description = result.description;
    dto.isPublic = result.isPublic;
    dto.createdAt = result.createdAt;
    dto.paperCount = result._count.papers;
    dto.isSaved = result.savedReadingLists.length > 0;
    dto.owner = SearchUserResDto.fromSource(result.owner, currentUserId);
    return dto;
  }
}
