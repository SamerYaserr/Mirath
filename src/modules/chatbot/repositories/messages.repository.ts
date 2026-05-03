import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export default class ChatMessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ChatMessageUncheckedCreateInput) {
    return await this.prisma.chatMessage.create({
      data,
    });
  }

  async hasMultipleMessages(sessionId: string) {
    const count = await this.prisma.chatMessage.count({
      where: { sessionId },
      take: 2,
    });

    return count > 1;
  }
}
