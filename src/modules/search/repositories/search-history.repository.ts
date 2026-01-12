import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';

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
}
