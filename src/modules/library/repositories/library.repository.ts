import { Injectable } from '@nestjs/common';
import { Paper, Prisma, SavedPaper } from '@prisma/client';

import { PrismaService } from 'src/modules/prisma/prisma.service';

type SavedPaperWithPaper = SavedPaper & {
  paper: Paper;
};

@Injectable()
export class LibraryRepository {
  constructor(private prisma: PrismaService) {}

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
}
