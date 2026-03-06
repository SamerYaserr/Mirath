import { ApiProperty } from '@nestjs/swagger';
import { SearchUserResDto } from './shared.res.dto';
import { DiscussionResult } from '../../search.types';

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

  @ApiProperty({ example: '2024-01-20T10:00:00.000Z' })
  updatedAt: Date;

  @ApiProperty({ example: 10 })
  commentCount: number;

  @ApiProperty({ example: '123e4567-e89b-12d3-a456-426614174000' })
  authorId: string;

  static fromResult(
    result: DiscussionResult,
    currentUserId: string,
  ): DiscussionSearchResDto {
    const dto = new DiscussionSearchResDto();
    dto.id = result.id;
    dto.title = result.title;
    dto.content = result.content;
    dto.upvoteCount = result.upvoteCount;
    dto.downvoteCount = result.downvoteCount;
    dto.createdAt = result.createdAt;
    dto.updatedAt = result.updatedAt;
    dto.commentCount = result.commentCount;
    dto.tags = result.topics.map((t) => t.interest.name);
    dto.authorId = result.author?.id;
    dto.author = SearchUserResDto.fromSource(result.author, currentUserId);
    return dto;
  }
}
