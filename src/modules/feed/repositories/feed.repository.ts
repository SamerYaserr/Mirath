import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';
import {
  FindRecentPapersArgs,
  FindRecentPapersRes,
  FindRecommendationPapersArgs,
  FindRecommendationPapersRes,
  FindUserForRecRes,
} from '../feed.types';

@Injectable()
export class FeedRepository {
  constructor(private readonly prisma: PrismaService) {}

  private readonly paperCardSelect = {
    id: true,
    title: true,
    abstract: true,
    publishedAt: true,
    authors: true,
    categories: true,
  } as const;

  async findRecentPapers(
    params: FindRecentPapersArgs,
  ): Promise<FindRecentPapersRes> {
    const { category, limit, offset } = params;

    const where: Prisma.PaperWhereInput = {};
    if (category) {
      where.categories = { has: category };
    }

    const [papers, total] = await Promise.all([
      this.prisma.paper.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        take: limit,
        skip: offset,
        select: this.paperCardSelect,
      }),
      this.prisma.paper.count({ where }),
    ]);

    return { papers, total };
  }

  async findSavedPaperIdsForUser(params: {
    userId: string;
    paperIds: string[];
  }): Promise<string[]> {
    const { userId, paperIds } = params;

    if (paperIds.length === 0) return [];

    const saved = await this.prisma.savedPaper.findMany({
      where: {
        userId,
        paperId: { in: paperIds },
      },
      select: { paperId: true },
    });

    return saved.map((s) => s.paperId);
  }

  async findUserForRecommendations(userId: string): Promise<FindUserForRecRes> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userInterests: { include: { interest: true } },
        userFields: { include: { field: true } },
      },
    });
  }

  async findRecommendationPapers(
    params: FindRecommendationPapersArgs,
  ): Promise<FindRecommendationPapersRes> {
    const { tags, limit, offset, userId } = params;

    const where: Prisma.PaperWhereInput = {
      categories: { hasSome: tags },
      savedPapers: { none: { userId } },
    };

    const [papers, total] = await Promise.all([
      this.prisma.paper.findMany({
        where,
        orderBy: { publishedAt: 'desc' },
        take: limit,
        skip: offset,
        select: this.paperCardSelect,
      }),
      this.prisma.paper.count({ where }),
    ]);

    return { papers, total };
  }
}
