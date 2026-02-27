import { VoteType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { AuthorResDto } from './author.res.dto';
import { TopicResDto } from './topic.res.dto';
import { PaperSummaryResDto } from './paper-summary.res.dto';

export class DiscussionResDto {
  @ApiProperty({
    description: 'Unique identifier of the discussion',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'Title of the discussion',
    example: 'The Future of Large Language Models',
  })
  title: string;

  @ApiProperty({
    description: 'Content body of the discussion',
    example: 'I believe we are reaching a plateau...',
  })
  content: string;

  @ApiProperty({
    description: 'Number of upvotes',
    example: 25,
  })
  upvoteCount: number;

  @ApiProperty({
    description: 'Number of downvotes',
    example: 3,
  })
  downvoteCount: number;

  @ApiProperty({
    description: 'Number of comments',
    example: 5,
  })
  commentCount: number;

  @ApiProperty({
    description: 'ID of the discussion author',
    example: 'a1b2c3d4-e5f6-4a5b-b5c6-d7e8f9a0b1c2',
  })
  authorId: string;

  @ApiProperty({
    description: 'Whether the current user has voted on this discussion',
    example: true,
  })
  hasVoted: boolean;

  @ApiPropertyOptional({
    description: 'The current user vote type, if voted',
    enum: VoteType,
    example: VoteType.UP,
  })
  userVoteType?: VoteType;

  @ApiProperty({
    description: 'List of topics associated with the discussion',
    type: [TopicResDto],
  })
  topics: TopicResDto[];

  @ApiProperty({
    description: 'The discussion author',
    type: AuthorResDto,
  })
  author: AuthorResDto;

  @ApiProperty({
    description: 'Papers referenced in the discussion',
    type: [PaperSummaryResDto],
  })
  papers: PaperSummaryResDto[];

  @ApiProperty({
    description: 'Discussion creation date',
    example: '2024-01-15T10:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Discussion last update date',
    example: '2024-01-15T10:00:00.000Z',
  })
  updatedAt: Date;
}
