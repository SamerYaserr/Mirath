import { Injectable } from '@nestjs/common';
import { SavedPaper, Paper, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

type SavedPaperWithPaper = SavedPaper & {
  paper: Paper;
};

@Injectable()
export class SavedPapersRepository {
  constructor(private prisma: PrismaService) {}

  async create(paperId: string, userId: string): Promise<SavedPaper> {
    return this.prisma.savedPaper.create({
      data: { paperId, userId },
    });
  }

  async find(paperId: string, userId: string): Promise<SavedPaper | null> {
    return this.prisma.savedPaper.findUnique({
      where: {
        userId_paperId: { paperId, userId },
      },
    });
  }

  async delete(paperId: string, userId: string): Promise<SavedPaper | null> {
    return this.prisma.savedPaper.delete({
      where: {
        userId_paperId: {
          paperId,
          userId,
        },
      },
    });
  }

  async findAll(
    userId: string,
    skip: number,
    limit: number,
    sort: string,
  ): Promise<SavedPaperWithPaper[]> {
    return this.prisma.savedPaper.findMany({
      where: {
        userId,
      },
      include: {
        paper: true,
      },
      orderBy: {
        createdAt: sort as Prisma.SortOrder,
      },
      skip,
      take: limit,
    });
  }

  async countByUserId(userId: string): Promise<number> {
    return this.prisma.savedPaper.count({
      where: { userId },
    });
  }
}
