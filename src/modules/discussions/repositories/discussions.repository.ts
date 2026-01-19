import { Injectable } from '@nestjs/common';
import { Discussion, Prisma } from '@prisma/client';

import { PrismaService } from 'src/modules/prisma/prisma.service';
import { SortType } from '../dto/get-discussions.dto';

@Injectable()
export class DiscussionsRepository {
  constructor(private prisma: PrismaService) {}

  create(
    title: string,
    content: string,
    topicIds: string[],
    authorId: string,
  ): Promise<Discussion> {
    return this.prisma.discussion.create({
      data: {
        title,
        content,
        authorId,
        topics: {
          create: topicIds.map((interestId) => ({
            interestId,
          })),
        },
      },
      include: {
        topics: {
          include: {
            interest: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        author: {
          select: {
            id: true,
            username: true,
            photoUrl: true,
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
}
