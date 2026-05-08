import { VoteType } from '@prisma/client';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

import { AuthorResDto } from './author.res.dto';
import { CommentResDto } from './created-comment.res.dto';
import { CommentWithRelations } from 'src/modules/comments/comments.types';

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

  static fromDetailedEntity(
    comment: CommentWithRelations,
    userId: string,
  ): DetailedCommentResDto {
    const { votes, ...rest } = comment!;
    const userVote = votes[0];

    const isMe = userId === rest.authorId;
    const isFollowing = !isMe && (rest.author as any).followers?.length > 0;

    return Object.assign(new DetailedCommentResDto(), {
      ...rest,
      author: {
        ...rest.author,
        isMe,
        isFollowing,
      },
      hasVoted: !!userVote,
      userVoteType: userVote?.type,
    });
  }
}
