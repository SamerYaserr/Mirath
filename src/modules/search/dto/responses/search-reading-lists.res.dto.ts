import { ApiProperty } from '@nestjs/swagger';
import { SearchUserResDto } from './shared.res.dto';

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
}
