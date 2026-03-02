import { ApiProperty } from '@nestjs/swagger';
import { SearchUserResDto } from './shared.res.dto';

export class DiscussionSearchResDto {
  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174001' })
  id: string;

  @ApiProperty({ example: 'Thoughts on the new transformer architecture?' })
  title: string;

  @ApiProperty({ example: "I've been reading the paper and..." })
  content: string;

  @ApiProperty({ example: 42 })
  upvoteCount: number;

  @ApiProperty({ example: 5 })
  downvoteCount: number;

  @ApiProperty({ example: '2024-01-20T10:00:00.000Z' })
  createdAt: Date;

  @ApiProperty({ example: ['AI', 'NLP'] })
  tags: string[];

  @ApiProperty({ type: SearchUserResDto })
  author: SearchUserResDto;
}
