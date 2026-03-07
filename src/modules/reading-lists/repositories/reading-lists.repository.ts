import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReadingListsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ReadingListUncheckedCreateInput) {
    return this.prisma.readingList.create({ data });
  }

  async findAllByUserId(userId: string, ownerId?: string) {
    const targetUserId = ownerId ?? userId;
    const isViewingOwnLists = targetUserId === userId;
    return this.prisma.readingList.findMany({
      where: {
        ownerId: targetUserId,
        ...(isViewingOwnLists ? {} : { isPublic: true }),
      },
      include: {
        owner: {
          select: {
            id: true,
            username: true,
            fullName: true,
            photoUrl: true,
          },
        },
        _count: {
          select: { papers: true },
        },
        papers: {
          take: 5,
          include: {
            paper: {
              select: { categories: true },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findAll() {
    return this.prisma.readingList.findMany({
      include: {
        _count: {
          select: { papers: true },
        },
        owner: {
          select: {
            id: true,
            username: true,
            fullName: true,
            photoUrl: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(id: string) {
    return this.prisma.readingList.findUnique({
      where: { id },
      include: {
        papers: {
          include: {
            paper: {
              select: {
                id: true,
                title: true,
                authors: true,
                abstract: true,
                categories: true,
                publishedAt: true,
                citation: true,
              },
            },
          },
        },
        owner: {
          select: {
            id: true,
            username: true,
            fullName: true,
            photoUrl: true,
          },
        },
      },
    });
  }

  async addPaper(readingListId: string, paperId: string) {
    return this.prisma.readingListPaper.create({
      data: {
        readingListId,
        paperId,
      },
    });
  }

  async removePaper(readingListId: string, paperId: string) {
    return this.prisma.readingListPaper.delete({
      where: {
        readingListId_paperId: {
          readingListId,
          paperId,
        },
      },
    });
  }

  async findOwner(readingListId: string): Promise<{ ownerId: string } | null> {
    return this.prisma.readingList.findUnique({
      where: { id: readingListId },
      select: { ownerId: true },
    });
  }
}
