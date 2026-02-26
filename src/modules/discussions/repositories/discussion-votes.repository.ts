import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/modules/prisma/prisma.service';
import { DiscussionVotesPK, UpdateVoteTypeArgs } from '../discussions.types';

@Injectable()
export class DiscussionVotesRepository {
  constructor(private prisma: PrismaService) {}

  async findOne(
    { userId, discussionId }: DiscussionVotesPK,
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
    { userId, discussionId, type }: UpdateVoteTypeArgs,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.discussionVote.update({
      where: { userId_discussionId: { userId, discussionId } },
      data: { type },
    });
  }

  async delete(
    { userId, discussionId }: DiscussionVotesPK,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.discussionVote.delete({
      where: { userId_discussionId: { userId, discussionId } },
    });
  }
}
