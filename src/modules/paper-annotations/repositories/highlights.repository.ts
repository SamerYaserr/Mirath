import { Injectable } from '@nestjs/common';
import { HighlightColor, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HighlightsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.HighlightUncheckedCreateInput) {
    return this.prisma.highlight.create({ data });
  }

  async findAllByUserAndPaper(
    userId: string,
    paperId: string,
    skip: number,
    take: number,
  ) {
    const [data, count] = await Promise.all([
      this.prisma.highlight.findMany({
        where: { userId, paperId },
        orderBy: { createdAt: 'asc' },
        skip,
        take,
      }),
      this.prisma.highlight.count({
        where: { userId, paperId },
      }),
    ]);

    return { data, count };
  }

  async findAllByUser(userId: string) {
    return this.prisma.highlight.findMany({
      where: { userId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async findById(id: string) {
    return this.prisma.highlight.findUnique({ where: { id } });
  }

  async updateColor(id: string, color: HighlightColor) {
    return this.prisma.highlight.update({
      where: { id },
      data: { color },
    });
  }

  async delete(id: string) {
    return this.prisma.highlight.delete({ where: { id } });
  }

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
