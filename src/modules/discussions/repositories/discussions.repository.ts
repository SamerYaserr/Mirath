import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { SortType } from '../dtos/get-discussions.dto';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import {
  DiscussionsFindManyArgs,
  UpdateCommentCountArgs,
  UpdateVoteCountsArgs,
} from '../discussions.types';

@Injectable()
export class DiscussionsRepository {
  constructor(private prisma: PrismaService) {}

  create(
    title: string,
    content: string,
    topicIds: string[],
    paperIds: string[],
    authorId: string,
  ) {
    return this.prisma.discussion.create({
      data: {
        title,
        content,
        authorId,
        papers: {
          connect: paperIds.map((id) => ({ id })),
        },
        topics: {
          create: topicIds.map((interestId) => ({
            interestId,
          })),
        },
      },
      include: {
        author: true,
        topics: {
          include: {
            interest: true,
          },
        },
        votes: {
          where: {
            userId: authorId,
          },
          select: {
            type: true,
          },
        },
        papers: {
          select: {
            id: true,
            authors: true,
            title: true,
            abstract: true,
          },
        },
      },
    });
  }

  async findMany(args: DiscussionsFindManyArgs) {
    const { topicId, authorId, sort, skip, limit, userId } = args;

    let whereClause: Prisma.DiscussionWhereInput = topicId
      ? {
          topics: {
            some: {
              interestId: topicId,
            },
          },
        }
      : {};

    if (authorId) whereClause.authorId = authorId;

    const orderByClause: Prisma.DiscussionOrderByWithRelationInput[] =
      sort === SortType.TOP
        ? [{ upvoteCount: 'desc' }, { createdAt: 'desc' }]
        : [{ createdAt: 'desc' }];

    return this.prisma.discussion.findMany({
      where: whereClause,
      orderBy: orderByClause,
      skip,
      take: limit,
      include: {
        topics: {
          include: {
            interest: true,
          },
        },
        author: true,
        votes: {
          where: {
            userId,
          },
          select: {
            type: true,
          },
        },
        papers: {
          select: {
            id: true,
            authors: true,
            title: true,
            abstract: true,
          },
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    return await this.prisma.discussion.findUnique({
      where: { id },
      include: {
        author: true,
        topics: {
          include: {
            interest: true,
          },
        },
        votes: {
          where: {
            userId,
          },
          select: {
            type: true,
          },
        },
        papers: {
          select: {
            id: true,
            authors: true,
            title: true,
            abstract: true,
          },
        },
      },
    });
  }

  async deleteOne(id: string) {
    await this.prisma.discussion.delete({ where: { id } });
  }

  async updateVoteCounts(
    { id, updates }: UpdateVoteCountsArgs,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    const data: Prisma.DiscussionUpdateInput = {};

    if (updates.upIncrement)
      data.upvoteCount = { increment: updates.upIncrement };

    if (updates.downIncrement)
      data.downvoteCount = { increment: updates.downIncrement };

    return client.discussion.update({
      where: { id },
      data,
    });
  }

  async updateCommentCount(
    { id, increment }: UpdateCommentCountArgs,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.discussion.update({
      where: { id },
      data: { commentCount: { increment } },
    });
  }
}
