import { VoteType } from '@prisma/client';

export type UpdateVoteCounts = {
  id: string;
  updates: { upIncrement?: number; downIncrement?: number };
};

export type CommentVoteServiceArgs = {
  userId: string;
  commentId: string;
  type: VoteType;
};

export type CommentVotesPK = {
  userId: string;
  commentId: string;
};

export type UpdateCommentVoteType = {
  type: VoteType;
} & CommentVotesPK;
