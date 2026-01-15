import { Injectable } from '@nestjs/common';
import { SavedPaper, Paper } from '@prisma/client';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class PaperRepository {
  constructor(private prisma: PrismaService) {}

  async find(paperId: string): Promise<Paper | null> {
    return this.prisma.paper.findUnique({
      where: {
        id: paperId,
      },
    });
  }

  async findSaved(paperId: string, userId: string): Promise<SavedPaper | null> {
    return this.prisma.savedPaper.findUnique({
      where: {
        userId_paperId: {
          paperId,
          userId,
        },
      },
    });
  }

  create(paperId: string, userId: string): Promise<SavedPaper | null> {
    return this.prisma.savedPaper.create({
      data: { paperId, userId },
    });
  }
}
