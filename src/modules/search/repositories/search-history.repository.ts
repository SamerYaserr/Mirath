import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { winstonLogger } from '../../../config/logger.config';

@Injectable()
export class SearchHistoryRepository {
  constructor(private prisma: PrismaService) {}

  async deleteById(id: string) {
    return await this.prisma.searchHistory.delete({ where: { id } });
  }

  async delete(userId: string) {
    return await this.prisma.searchHistory.deleteMany({ where: { userId } });
  }

  async exist(id: string, userId: string): Promise<boolean> {
    return !!(await this.prisma.searchHistory.findUnique({
      where: { id, userId },
    }));
  }

  async find(userId: string, take: number) {
    return await this.prisma.searchHistory.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async create(userId: string, query: string): Promise<void> {
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
}
