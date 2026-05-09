import { Injectable } from '@nestjs/common';
import { SavedPaper } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { SearchInPaperResDto } from '../dto/responses/search-in-paper.res.dto';

export interface SearchResult {
  id: string;
  title: string;
  abstract: string;
  publishedAt: Date;
  isSaved: boolean;
  authors: string[];
  categories: string[];
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
        p.authors,
        p.categories,
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

  async findDetailed(paperId: string) {
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

  async find(paperId: string) {
    return this.prisma.paper.findUnique({
      where: {
        id: paperId,
      },
      select: {
        id: true,
      },
    });
  }

  async searchInPaper(
    paperId: string,
    q: string,
  ): Promise<Omit<SearchInPaperResDto, 'query'>> {
    const query = q.toLowerCase().trim();

    /*
      * The idea is to find every position where the search query appears inside the fullText string in the Paper table and return those positions as an array

      * strpos(text, query) only returns the first match, so we need to run it recursively ... find the first match, then move past it, find the next, etc... This is repeated until there are no more matches left. This loop could be done using a RECURSIVE CTE

      * I haven't used Pick<SearchInPaperResDto, 'positions'> here because it destroyed the coloring provided by the SQL syntax highlighter in my IDE :)
    */
    const rows = await this.prisma.$queryRaw<{ positions: number[] }[]>`
    WITH RECURSIVE 
    -- Get the full text of the paper
    paper AS 
    (
      SELECT "fullText"
      FROM "Paper"
      WHERE id = ${paperId}
    ),
    -- Use the first CTE (paper) for some preprocessing. Convert the full text and the query to lowercase for case-insensitive search, and calculate the length of the query for later use (compute this once instead of doing it in every iteration of the loop)
    ft AS 
    (
      SELECT 
        LOWER("fullText") AS txt,
        LOWER(${query}) AS q,
        LENGTH(LOWER(${query})) AS qlen
      FROM paper
    ), 
    matches AS 
    (
      -- Base case: find the first occurrence of the query
      SELECT
        strpos(ft.txt, ft.q) - 1 AS position, -- Converted to 0-indexed
        strpos(ft.txt, ft.q) + ft.qlen AS next_start -- Position to start the next search from
      FROM ft
      WHERE strpos(ft.txt, ft.q) > 0

      UNION ALL

      -- Recursive case: find the next occurrence of the query after the previous match
      SELECT
        m.next_start + strpos(substring(ft.txt FROM m.next_start), ft.q) - 2,
        m.next_start + strpos(substring(ft.txt FROM m.next_start), ft.q) - 1 + ft.qlen
      FROM matches m, ft
      WHERE strpos(substring(ft.txt FROM m.next_start), ft.q) > 0
    )

    SELECT
      coalesce(array_agg(position ORDER BY position), ARRAY[]::int[]) AS positions
    FROM matches;
    `;

    return {
      count: rows[0]?.positions.length || 0,
      positions: rows[0]?.positions || [],
    };
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

  async findMany(paperIds: string[]) {
    return this.prisma.paper.findMany({ where: { id: { in: paperIds } } });
  }
}
