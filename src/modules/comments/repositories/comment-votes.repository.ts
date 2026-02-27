import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/modules/prisma/prisma.service';
import { CommentVotesPK, UpdateCommentVoteType } from '../comments.types';

@Injectable()
export class CommentVotesRepository {
  constructor(private prisma: PrismaService) {}

  async findOne(
    { userId, commentId }: CommentVotesPK,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.commentVote.findUnique({
      where: {
        userId_commentId: { userId, commentId },
      },
    });
  }

  async create(
    data: Prisma.CommentVoteUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.commentVote.create({ data });
  }

  async updateVoteType(
    { userId, commentId, type }: UpdateCommentVoteType,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.commentVote.update({
      where: { userId_commentId: { userId, commentId } },
      data: { type },
    });
  }

  async delete(
    { userId, commentId }: CommentVotesPK,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.commentVote.delete({
      where: { userId_commentId: { userId, commentId } },
    });
  }
}
