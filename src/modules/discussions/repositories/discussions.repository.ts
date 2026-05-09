import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { SortType } from '../dto/requests/get-discussions.req.dto';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import {
  DiscussionsFindManyArgs,
  UpdateCommentCountArgs,
  UpdateVoteCountsArgs,
} from '../discussions.types';

@Injectable()
export class DiscussionsRepository {
  constructor(private prisma: PrismaService) {}

  private authorSelect(userId: string): Prisma.UserSelect {
    return {
      id: true,
      bio: true,
      fullName: true,
      username: true,
      photoUrl: true,
      isPremium: true,
      followings: {
        where: { followerId: userId },
        select: { followerId: true },
      },
    };
  }

  private readonly paperSelectCard: Prisma.PaperSelect = {
    id: true,
    authors: true,
    title: true,
    abstract: true,
  };

  async create({
    title,
    content,
    authorId,
    paperIds,
    topicIds,
  }: Prisma.DiscussionUncheckedCreateInput & {
    paperIds: string[];
    topicIds: string[];
  }) {
    return await this.prisma.discussion.create({
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
        author: { select: this.authorSelect(authorId as string) },
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
          select: this.paperSelectCard,
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
        author: { select: this.authorSelect(userId as string) },
        votes: {
          where: {
            userId,
          },
          select: {
            type: true,
          },
        },
        papers: {
          select: this.paperSelectCard,
        },
      },
    });
  }

  async findOne(id: string, userId: string) {
    return await this.prisma.discussion.findUnique({
      where: { id },
      include: {
        author: {
          select: this.authorSelect(userId as string),
        },
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
          select: this.paperSelectCard,
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
