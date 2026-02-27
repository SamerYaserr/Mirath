import { VoteType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { AuthorResDto } from './author.res.dto';
import { CommentResDto } from './created-comment.res.dto';

export class DetailedCommentResDto extends CommentResDto {
  @ApiProperty({
    description: 'Whether the current user has voted on this comment',
    example: false,
  })
  hasVoted: boolean;

  @ApiPropertyOptional({
    description: 'The current user vote type, if voted',
    enum: VoteType,
  })
  userVoteType?: VoteType;

  @ApiProperty({
    description: 'The comment author',
    type: AuthorResDto,
  })
  author: AuthorResDto;
}
