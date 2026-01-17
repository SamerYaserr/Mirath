import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Prisma } from '@prisma/client';

type PaperCard = {
  id: string;
  title: string;
  abstract: string | null;
  publishedAt: Date;
  authors: string[];
  categories: string[];
};

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

  async findRecentPapers(params: {
    category: string | undefined;
    limit: number;
    offset: number;
  }): Promise<{ papers: PaperCard[]; total: number }> {
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

  async findUserForRecommendations(userId: string): Promise<{
    id: string;
    userInterests: { interest: { name: string } }[];
    userFields: { field: { name: string } }[];
  } | null> {
    return this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        userInterests: { include: { interest: true } },
        userFields: { include: { field: true } },
      },
    });
  }

  async findRecommendationPapers(params: {
    tags: string[];
    limit: number;
    offset: number;
    userId: string;
  }): Promise<{ papers: PaperCard[]; total: number }> {
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
