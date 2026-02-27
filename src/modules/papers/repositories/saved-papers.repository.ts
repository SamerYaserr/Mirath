import { Injectable } from '@nestjs/common';
import { SavedPaper } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

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
}
