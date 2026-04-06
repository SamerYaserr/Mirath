import { ApiProperty } from '@nestjs/swagger';
import { SavedReadingList } from '../../reading-list.types';
import { OwnerResDto } from './shared.res.dto';

export class GetUserSavedListsResDto {
  @ApiProperty({ example: 'c1a9d9f1-4b21-4b99-8d22-347799777555' })
  readingListId: string;

  @ApiProperty({ example: 't4gvmte3-pppe-4crf-r333-9qfeqq15q7qq' })
  userId: string;

  @ApiProperty({ example: '2026-01-19T18:39:07.379Z' })
  savedAt: Date;

  @ApiProperty({ type: OwnerResDto })
  owner: OwnerResDto;

  @ApiProperty({ example: 5 })
  paperCount: number;

  @ApiProperty({ example: ['AI', 'CNN', 'Deep Learning'] })
  previewTags: string[];

  static fromList(list: SavedReadingList): GetUserSavedListsResDto {
    const dto = new GetUserSavedListsResDto();
    dto.readingListId = list.readingListId;
    dto.userId = list.userId;
    dto.savedAt = list.savedAt;

    // Grab these from inside readingList!
    dto.paperCount = list.readingList._count.papers;
    dto.owner = OwnerResDto.fromOwner(list.readingList.owner);

    const allCategories = list.readingList.papers.flatMap(
      (p) => p.paper.categories ?? [],
    );
    dto.previewTags = [...new Set(allCategories)].slice(0, 3);

    return dto;
  }
}
