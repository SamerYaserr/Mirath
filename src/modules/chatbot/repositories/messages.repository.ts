import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/modules/prisma/prisma.service';
import {
  CreateAttachmentData,
  CreateMessageData,
  FindManyParams,
} from '../chatbot.types';

@Injectable()
export default class ChatMessagesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: Prisma.ChatMessageUncheckedCreateInput) {
    return await this.prisma.chatMessage.create({ data });
  }

  async createWithAttachment(
    messageData: CreateMessageData,
    attachmentData: CreateAttachmentData,
  ) {
    return await this.prisma.$transaction(async (tx) => {
      const message = await tx.chatMessage.create({ data: messageData });

      const attachment = await tx.messageAttachment.create({
        data: { ...attachmentData, messageId: message.id },
      });

      return { message, attachment };
    });
  }

  async createAttachment(messageId: string, data: CreateAttachmentData) {
    return await this.prisma.messageAttachment.create({
      data: { ...data, messageId },
    });
  }

  async updateContent(messageId: string, content: string) {
    return await this.prisma.chatMessage.update({
      where: { id: messageId },
      data: { content },
    });
  }

  async hasMultipleMessages(sessionId: string) {
    const count = await this.prisma.chatMessage.count({
      where: { sessionId },
      take: 2,
    });

    return count > 1;
  }

  async findMany({ sessionId, skip, limit: take }: FindManyParams) {
    return await this.prisma.chatMessage.findMany({
      where: { sessionId },
      skip,
      take,
      orderBy: { createdAt: 'asc' },
      select: {
        id: true,
        role: true,
        type: true,
        content: true,
        createdAt: true,
        attachments: {
          select: {
            id: true,
            type: true,
            url: true,
            mimeType: true,
            sizeBytes: true,
            durationSeconds: true,
            createdAt: true,
          },
        },
        feedback: {
          select: {
            id: true,
            type: true,
            createdAt: true,
            updatedAt: true,
          },
        },
      },
    });
  }

  async count(sessionId: string) {
    return await this.prisma.chatMessage.count({ where: { sessionId } });
  }
}
