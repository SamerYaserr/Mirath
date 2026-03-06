import { ApiProperty } from '@nestjs/swagger';
import { DiscussionSearchResDto } from './search-discussions.res.dto';
import { ReadingListSearchResDto } from './search-reading-lists.res.dto';
import { ResearcherSearchResDto } from './search-researchers.res.dto';

export class GlobalSearchResDto {
  @ApiProperty({ type: [DiscussionSearchResDto] })
  discussions: DiscussionSearchResDto[];

  @ApiProperty({ type: [ReadingListSearchResDto] })
  readingLists: ReadingListSearchResDto[];

  @ApiProperty({ type: [ResearcherSearchResDto] })
  researchers: ResearcherSearchResDto[];

  static fromParts(
    discussions: DiscussionSearchResDto[],
    readingLists: ReadingListSearchResDto[],
    researchers: ResearcherSearchResDto[],
  ): GlobalSearchResDto {
    const dto = new GlobalSearchResDto();
    dto.discussions = discussions;
    dto.readingLists = readingLists;
    dto.researchers = researchers;
    return dto;
  }
}
