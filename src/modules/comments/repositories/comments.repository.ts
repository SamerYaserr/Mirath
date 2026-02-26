import { Injectable } from '@nestjs/common';
import { Prisma, VoteType } from '@prisma/client';

import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class CommentsRepository {
  constructor(private prisma: PrismaService) {}

  async findOne(id: string, userId: string) {
    return await this.prisma.comment.findUnique({
      where: { id },
      include: {
        author: true,
        votes: {
          where: {
            userId,
          },
          select: {
            type: true,
          },
        },
      },
    });
  }

  async findVote(
    userId: string,
    commentId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.commentVote.findUnique({
      where: {
        userId_commentId: { userId, commentId },
      },
    });
  }

  async createVote(
    userId: string,
    commentId: string,
    type: VoteType,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.commentVote.create({
      data: { userId, commentId, type },
    });
  }

  async updateVoteType(
    userId: string,
    commentId: string,
    type: VoteType,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.commentVote.update({
      where: { userId_commentId: { userId, commentId } },
      data: { type },
    });
  }

  async updateVoteCounts(
    id: string,
    updates: { upIncrement?: number; downIncrement?: number },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    const data: Prisma.CommentUpdateInput = {};

    if (updates.upIncrement) {
      data.upvoteCount = { increment: updates.upIncrement };
    }
    if (updates.downIncrement) {
      data.downvoteCount = { increment: updates.downIncrement };
    }

    return client.comment.update({
      where: { id },
      data,
    });
  }

  async deleteVote(
    userId: string,
    commentId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.commentVote.delete({
      where: { userId_commentId: { userId, commentId } },
    });
  }
}
