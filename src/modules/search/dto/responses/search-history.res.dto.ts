import { ApiProperty } from '@nestjs/swagger';
import { SearchHistoryEntryResDto } from './shared.res.dto';

export class GetSearchHistoryResDto {
  @ApiProperty({ example: 2 })
  size: number;

  @ApiProperty({ type: [SearchHistoryEntryResDto] })
  data: SearchHistoryEntryResDto[];
}
