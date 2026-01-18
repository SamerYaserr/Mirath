import { Injectable } from '@nestjs/common';
import { Discussion } from '@prisma/client';

import { PrismaService } from 'src/modules/prisma/prisma.service';

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
