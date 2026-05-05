import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { RenameChatSessionPayload } from '../chatbot.types';

@Injectable()
export default class ChatSessionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.chatSession.findUnique({
      where: { id },
    });
  }

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

  async deleteOne(id: string) {
    await this.prisma.chatSession.delete({ where: { id } });
  }

  async updateTitle({
    newTitle,
    sessionId,
  }: Omit<RenameChatSessionPayload, 'userId'>) {
    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { title: newTitle! },
    });
  }

  async touch(sessionId: string) {
    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { updatedAt: new Date() },
    });
  }

  async updateTitleAndTouch({
    sessionId,
    newTitle,
  }: Omit<RenameChatSessionPayload, 'userId'>) {
    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { ...(newTitle && { title: newTitle }), updatedAt: new Date() },
    });
  }
}
