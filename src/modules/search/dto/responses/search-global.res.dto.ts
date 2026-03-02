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
}
