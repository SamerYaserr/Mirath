import { Injectable } from '@nestjs/common';
import { Prisma, VoteType } from '@prisma/client';

import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class CommentVotesRepository {
  constructor(private prisma: PrismaService) {}

  async findOne(
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

  async create(
    data: Prisma.CommentVoteUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.commentVote.create({ data });
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

  async delete(
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
