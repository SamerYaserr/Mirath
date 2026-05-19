import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';
import { RenameChatSessionPayload } from '../chatbot.types';

const TEMPORARY_TTL_MS = 24 * 60 * 60 * 1000;

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
    return this.prisma.chatSession.create({
      data: { userId, title, isTemporary },
    });
  }

  async createTemporary(userId: string) {
    const expiresAt = new Date(Date.now() + TEMPORARY_TTL_MS);
    return this.prisma.chatSession.create({
      data: {
        userId,
        title: 'Temporary Chat',
        isTemporary: true,
        expiresAt,
      },
    });
  }

  async findExpiredTemporary() {
    return this.prisma.chatSession.findMany({
      where: {
        isTemporary: true,
        expiresAt: { lt: new Date() },
      },
    });
  }

  async extendExpiry(sessionId: string) {
    const expiresAt = new Date(Date.now() + TEMPORARY_TTL_MS);
    await this.prisma.chatSession.update({
      where: { id: sessionId },
      data: { expiresAt },
    });
  }

  async findAll(userId: string, limit: number, skip: number) {
    return this.prisma.chatSession.findMany({
      where: { userId, isTemporary: false },
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
  }

  async findOne(id: string) {
    return this.prisma.chatSession.findUnique({
      where: { id },
    });
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
