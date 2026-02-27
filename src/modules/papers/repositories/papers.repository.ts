import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

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

  async findMany(paperIds: string[]) {
    return this.prisma.paper.findMany({ where: { id: { in: paperIds } } });
  }
}
