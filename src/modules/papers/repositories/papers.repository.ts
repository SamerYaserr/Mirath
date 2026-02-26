import { Injectable } from '@nestjs/common';
import { SavedPaper } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { winstonLogger } from '../../../config/logger.config';

export interface SearchResult {
  id: string;
  title: string;
  abstract: string;
  publishedAt: Date;
  isSaved: boolean;
}

@Injectable()
export class PapersRepository {
  constructor(private prisma: PrismaService) {}

  async searchPapers(
    userId: string,
    query: string,
    limit: number,
    offset: number,
  ): Promise<SearchResult[]> {
    const results = await this.prisma.$queryRaw<SearchResult[]>`
      SELECT 
        p.id, 
        p.title, 
        p."publishedAt",
        CASE 
          WHEN LENGTH(p.abstract) > 200 THEN LEFT(p.abstract, 200) || '...' 
          ELSE p.abstract 
        END as abstract,
        CASE 
          WHEN sp."paperId" IS NOT NULL THEN true 
          ELSE false 
        END as "isSaved"
      FROM "Paper" p
      LEFT JOIN "SavedPaper" sp 
        ON p.id = sp."paperId" AND sp."userId" = ${userId}
      WHERE 
        p."fullText" ILIKE '%' || ${query} || '%' 
      ORDER BY 
        SIMILARITY(p."fullText", ${query}) DESC,
        p."publishedAt" DESC
      LIMIT ${limit} 
      OFFSET ${offset}
    `;

    return results;
  }

  async createSearchHistory(userId: string, query: string): Promise<void> {
    try {
      await this.prisma.searchHistory.create({
        data: {
          userId,
          query,
          createdAt: new Date(),
        },
      });
    } catch (error) {
      winstonLogger.warn('Failed to save SearchHistory', {
        userId,
        query,
        error: error instanceof Error ? error.message : error,
      });
    }
  }

  async create(paperId: string, userId: string): Promise<SavedPaper> {
    return this.prisma.savedPaper.create({
      data: { paperId, userId },
    });
  }

  async find(paperId: string) {
    // Don't return the fullText in the result if U don't need to
    return this.prisma.paper.findUnique({
      where: {
        id: paperId,
      },
      select: {
        id: true,
        citation: true,
        title: true,
        abstract: true,
        authors: true,
        categories: true,
        publishedAt: true,
        content: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async findSaved(paperId: string, userId: string): Promise<SavedPaper | null> {
    return this.prisma.savedPaper.findUnique({
      where: {
        userId_paperId: { paperId, userId },
      },
    });
  }

  async deleteSaved(
    paperId: string,
    userId: string,
  ): Promise<SavedPaper | null> {
    return this.prisma.savedPaper.delete({
      where: {
        userId_paperId: {
          paperId,
          userId,
        },
      },
    });
  }

  async findByIds(paperIds: string[]) {
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
}
