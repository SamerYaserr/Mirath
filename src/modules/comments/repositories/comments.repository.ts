import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PrismaService } from 'src/modules/prisma/prisma.service';
import { UpdateVoteCounts } from '../comments.types';

@Injectable()
export class CommentsRepository {
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

  async create(
    data: Prisma.CommentUncheckedCreateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return await client.comment.create({ data });
  }

  async findById(id: string, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    return await client.comment.findUnique({ where: { id } });
  }

  async findDiscussionComments(userId: string, discussionId: string) {
    return this.prisma.comment.findMany({
      where: { discussionId },
      include: {
        author: {
          select: this.authorSelect(userId as string),
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
      orderBy: { createdAt: 'asc' },
    });
  }

  async findOne(id: string, userId: string) {
    return await this.prisma.comment.findUnique({
      where: { id },
      include: {
        author: {
          select: this.authorSelect(userId as string),
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

  async updateVoteCounts(
    { id, updates }: UpdateVoteCounts,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    const data: Prisma.CommentUpdateInput = {};

    if (updates.upIncrement)
      data.upvoteCount = { increment: updates.upIncrement };

    if (updates.downIncrement)
      data.downvoteCount = { increment: updates.downIncrement };

    return client.comment.update({
      where: { id },
      data,
    });
  }
}
