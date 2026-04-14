import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HighlightsRepository {
  constructor(private prisma: PrismaService) {}

  async countNotes(userId: string, paperId: string) {
    return await this.prisma.highlight.count({
      where: { userId, paperId, note: { not: null } },
    });
  }

  async find(id: string) {
    return await this.prisma.highlight.findFirst({ where: { id } });
  }

  async setNote(id: string, note: string) {
    return await this.prisma.highlight.update({
      where: { id },
      data: { note },
    });
  }

  async deleteNote(id: string) {
    return await this.prisma.highlight.update({
      where: { id },
      data: { note: null },
    });
  }

  async getNotes(userId: string, paperId: string, skip: number, limit: number) {
    return await this.prisma.highlight.findMany({
      where: { userId, paperId, note: { not: null } },
      orderBy: { updatedAt: 'desc' },
      skip,
      take: limit,
    });
  }
}
