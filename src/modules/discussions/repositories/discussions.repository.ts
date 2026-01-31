import { Injectable } from '@nestjs/common';
import { Prisma, VoteType } from '@prisma/client';

import { SortType } from '../dtos/get-discussions.dto';
import { PrismaService } from 'src/modules/prisma/prisma.service';

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

  async findAll(
    userId: string,
    sort: SortType,
    skip: number,
    limit: number,
    topicId?: string,
    authorId?: string,
  ) {
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

  async findVote(
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

  async createVote(
    userId: string,
    discussionId: string,
    type: VoteType,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.discussionVote.create({
      data: { userId, discussionId, type },
    });
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

  async updateVoteCounts(
    id: string,
    updates: { upIncrement?: number; downIncrement?: number },
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    const data: Prisma.DiscussionUpdateInput = {};
    if (updates.upIncrement) {
      data.upvoteCount = { increment: updates.upIncrement };
    }
    if (updates.downIncrement) {
      data.downvoteCount = { increment: updates.downIncrement };
    }
    return client.discussion.update({
      where: { id },
      data,
    });
  }

  async deleteVote(
    userId: string,
    discussionId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.discussionVote.delete({
      where: { userId_discussionId: { userId, discussionId } },
    });
  }

  async updateCommentCount(
    id: string,
    increment: number,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.discussion.update({
      where: { id },
      data: { commentCount: { increment } },
    });
  }

  async findExistingTopics(topicIds: string[]) {
    return await this.prisma.interest.findMany({
      where: {
        id: {
          in: topicIds,
        },
      },
      select: {
        id: true,
      },
    });
  }

  async findExistingPapers(paperIds: string[]) {
    return await this.prisma.paper.findMany({
      where: {
        id: {
          in: paperIds,
        },
      },
      select: {
        id: true,
      },
    });
  }

  async findExistingUsers(ids: string[]) {
    if (ids.length === 1) {
      const user = await this.prisma.user.findUnique({
        where: { id: ids[0]! },
        select: { id: true },
      });
      return user ? [user] : [];
    }

    return this.prisma.user.findMany({
      where: {
        id: { in: ids },
      },
      select: {
        id: true,
      },
    });
  }

  async createComment(
    discussionId: string,
    authorId: string,
    content: string,
    parentId?: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return await client.comment.create({
      data: {
        authorId,
        discussionId,
        content,
        parentId: parentId ?? null,
      },
    });
  }

  async findComment(id: string, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    return await client.comment.findUnique({ where: { id } });
  }

  async findDiscussionComments(userId: string, discussionId: string) {
    return this.prisma.comment.findMany({
      where: { discussionId },
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
      orderBy: { createdAt: 'asc' },
    });
  }
}

export type DiscussionWithRelations = Awaited<
  ReturnType<DiscussionsRepository['findOne']>
>;
