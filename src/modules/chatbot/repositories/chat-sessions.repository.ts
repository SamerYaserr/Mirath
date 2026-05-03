import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class ChatSessionsRepository {
  constructor(private prisma: PrismaService) {}

  async create(
    userId: string,
    title: string = 'New Chat',
    isTemporary: boolean = false,
  ) {
    const session = await this.prisma.chatSession.create({
      data: { userId, title, isTemporary },
    });

    return session;
  }

  async findAll(userId: string, limit: number, skip: number) {
    const sessions = await this.prisma.chatSession.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      take: limit,
      skip,
      include: {
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    return sessions;
  }

  async findOne(id: string) {
    const session = await this.prisma.chatSession.findUnique({
      where: { id },
    });

    return session;
  }
}
