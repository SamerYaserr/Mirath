import { User, VoteType } from '@prisma/client';
import { SortType } from './dto/requests/get-discussions.req.dto';
import { DiscussionsRepository } from './repositories/discussions.repository';
import { CreateCommentDto } from './dto/requests/create-comment.req.dto';

export type CheckExistingType = 'topic' | 'paper' | 'users';

export type DiscussionWithRelations = Awaited<
  ReturnType<DiscussionsRepository['create']>
>;

export type DiscussionsFindManyArgs = {
  sort: SortType;
  skip: number;
  limit: number;

  userId: string;
  topicId?: string | undefined;
  authorId?: string | undefined;
};

export type UpdateVoteCountsArgs = {
  id: string;
  updates: { upIncrement?: number; downIncrement?: number };
};

export type UpdateCommentCountArgs = { id: string; increment: number };

export type DiscussionVotesPK = {
  userId: string;
  discussionId: string;
};

export type UpdateVoteTypeArgs = {
  type: VoteType;
} & DiscussionVotesPK;

export type VoteServiceArgs = {
  discussionId: string;
  type: VoteType;
  user: User;
}

export type CreateCommentServiceArgs = {
  dto: CreateCommentDto;
} & DiscussionVotesPK;
