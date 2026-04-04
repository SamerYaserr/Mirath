import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReadingListsRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.ReadingListUncheckedCreateInput) {
    return this.prisma.readingList.create({ data });
  }

  async findAllByUserId(
    userId: string,
    ownerId?: string,
    options?: Prisma.ReadingListFindManyArgs,
  ) {
    const targetUserId = ownerId ?? userId;
    const isViewingOwnLists = targetUserId === userId;

    return this.prisma.readingList.findMany({
      where: {
        ownerId: targetUserId,
        ...(isViewingOwnLists ? {} : { isPublic: true }),
      },
      ...(options?.skip !== undefined ? { skip: options.skip } : {}),
      ...(options?.take !== undefined ? { take: options.take } : {}),
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

  async countByUserId(userId: string, ownerId?: string) {
    const targetUserId = ownerId ?? userId;
    const isViewingOwnLists = targetUserId === userId;

    return this.prisma.readingList.count({
      where: {
        ownerId: targetUserId,
        ...(isViewingOwnLists ? {} : { isPublic: true }),
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

  async addPaper(
    readingListId: string,
    paperId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.readingListPaper.create({
      data: {
        readingListId,
        paperId,
      },
    });
  }

  async removePaper(
    readingListId: string,
    paperId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.readingListPaper.delete({
      where: {
        readingListId_paperId: {
          readingListId,
          paperId,
        },
      },
    });
  }

  async findOwner(
    readingListId: string,
    tx?: Prisma.TransactionClient,
  ): Promise<{ ownerId: string } | null> {
    const client = tx || this.prisma;
    return client.readingList.findUnique({
      where: { id: readingListId },
      select: { ownerId: true },
    });
  }

  async update(
    id: string,
    data: Prisma.ReadingListUpdateInput,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return client.readingList.update({ where: { id }, data });
  }

  async delete(id: string, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    return client.readingList.delete({ where: { id } });
  }
}
