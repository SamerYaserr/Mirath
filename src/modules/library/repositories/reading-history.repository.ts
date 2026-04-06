import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { ReadingHistory, Paper } from '@prisma/client';

@Injectable()
export class ReadingHistoryRepository {
  constructor(private readonly prisma: PrismaService) {}

  
  async findHistory(userId: string, paperId: string): Promise<ReadingHistory | null> {
    return this.prisma.readingHistory.findUnique({
      where: {
        userId_paperId: {
          userId,
          paperId,
        },
      },
    });
  }
  
  async upsertHistory(userId: string, paperId: string): Promise<ReadingHistory> {
    return this.prisma.readingHistory.upsert({
      where: {
        userId_paperId: {
          userId,
          paperId,
        },
      },
      update: {
        viewedAt: new Date(),
      },
      create: {
        userId,
        paperId,
      },
    });
  }

  async findUserHistory(
    userId: string,
    skip: number,
    limit: number,
  ): Promise<[number, (ReadingHistory & { paper: Paper })[]]> {
    return Promise.all([
      this.prisma.readingHistory.count({ where: { userId } }),
      this.prisma.readingHistory.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: { viewedAt: 'desc' },
        include: { paper: true },
      }),
    ]);
  }

  async deleteAllUserHistory(userId: string): Promise<void> {
    await this.prisma.readingHistory.deleteMany({
      where: { userId },
    });
  }

  async removePaperFromHistory(userId: string, paperId: string): Promise<void> {
    await this.prisma.readingHistory.delete({
      where: {
        userId_paperId: {
          userId,
          paperId,
        },
      },
    });
  }
}
