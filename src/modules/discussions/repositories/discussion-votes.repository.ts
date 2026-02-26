import { Injectable } from '@nestjs/common';
import { Prisma, VoteType } from '@prisma/client';

import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class DiscussionVotesRepository {
  constructor(private prisma: PrismaService) {}

  async findOne(
    userId: string,
    discussionId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.discussionVote.findUnique({
      where: {
        userId_discussionId: { userId, discussionId },
      },
    });
  }

  async create(
    data: Prisma.DiscussionVoteUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.discussionVote.create({ data });
  }

  async updateVoteType(
    userId: string,
    discussionId: string,
    type: VoteType,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.discussionVote.update({
      where: { userId_discussionId: { userId, discussionId } },
      data: { type },
    });
  }

  async delete(
    userId: string,
    discussionId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.discussionVote.delete({
      where: { userId_discussionId: { userId, discussionId } },
    });
  }
}
