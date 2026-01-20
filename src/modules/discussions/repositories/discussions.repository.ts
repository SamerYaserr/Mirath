import { Injectable } from '@nestjs/common';
import { Prisma, VoteType } from '@prisma/client';

import { PrismaService } from 'src/modules/prisma/prisma.service';
import { SortType } from '../dto/get-discussions.dto';

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
        paperIds,
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
      },
    });
  }

  async findAll(
    userId: string,
    sort: string,
    skip: number,
    limit: number,
    topicId?: string,
  ) {
    const whereClause: Prisma.DiscussionWhereInput = topicId
      ? {
          topics: {
            some: {
              interestId: topicId,
            },
          },
        }
      : {};

    const orderByClause: Prisma.DiscussionOrderByWithRelationInput =
      sort === SortType.TOP ? { voteScore: 'desc' } : { createdAt: 'desc' };

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

  async updateVoteScore(
    id: string,
    increment: number,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.discussion.update({
      where: { id },
      data: { voteScore: { increment } },
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
}

export type DiscussionWithRelations = Awaited<
  ReturnType<DiscussionsRepository['findOne']>
>;
