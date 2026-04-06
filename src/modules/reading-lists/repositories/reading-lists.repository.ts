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

  async count() {
    return this.prisma.readingList.count();
  }

  async findAll(options?: Prisma.ReadingListFindManyArgs) {
    return this.prisma.readingList.findMany({
      ...(options?.skip !== undefined ? { skip: options.skip } : {}),
      ...(options?.take !== undefined ? { take: options.take } : {}),
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

  async findById(id: string, userId?: string) {
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

  async save(readingListId: string, userId: string): Promise<void> {
    await this.prisma.savedReadingList.createMany({
      data: { readingListId, userId },
      skipDuplicates: true,
    });
  }

  async unsave(readingListId: string, userId: string): Promise<number> {
    const { count } = await this.prisma.savedReadingList.deleteMany({
      where: { readingListId, userId },
    });
    return count;
  }

  async findAllSaved(userId: string) {
    return this.prisma.savedReadingList.findMany({
      where: { userId },
      orderBy: {
        savedAt: 'desc',
      },
      include: {
        readingList: {
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
        },
      },
    });
  }

  async findSavedById(readingListId: string, userId: string) {
    return this.prisma.savedReadingList.findUnique({
      where: {
        userId_readingListId: {
          userId,
          readingListId,
        },
      },
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
