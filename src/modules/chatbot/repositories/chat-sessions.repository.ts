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
}
