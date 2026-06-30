import { Injectable, NotFoundException } from '@nestjs/common';
import { Notification, NotificationType, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

interface CreateNotificationData {
  recipientId: string;
  actorId?: string | undefined;
  type: NotificationType;
  metadata: Prisma.InputJsonValue;
  jobId?: string | undefined;
}

@Injectable()
export class NotificationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: CreateNotificationData): Promise<Notification> {
    const { recipientId, type, metadata } = data;
    const actorId = data.actorId ?? null;
    const jobId = data.jobId ?? null;

    if (jobId) {
      return this.prisma.notification.upsert({
        where: { jobId },
        create: { recipientId, actorId, type, metadata, jobId },
        update: {},
      });
    }

    return this.prisma.notification.create({
      data: { recipientId, actorId, type, metadata },
    });
  }

  async findAllByRecipient(
    recipientId: string,
    skip: number,
    limit: number,
  ): Promise<Notification[]> {
    return this.prisma.notification.findMany({
      where: { recipientId },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    });
  }

  async countByRecipient(recipientId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { recipientId },
    });
  }

  async countUnread(recipientId: string): Promise<number> {
    return this.prisma.notification.count({
      where: { recipientId, isRead: false },
    });
  }

  async markAsRead(id: string, recipientId: string): Promise<Notification> {
    const notification = await this.prisma.notification.updateMany({
      where: { id, recipientId },
      data: { isRead: true },
    });

    if (notification.count === 0) {
      throw new NotFoundException(`Notification ${id} not found`);
    }

    return this.prisma.notification.findUniqueOrThrow({ where: { id } });
  }

  async markAllAsRead(recipientId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.notification.updateMany({
      where: { recipientId, isRead: false },
      data: { isRead: true },
    });
  }

  async deleteOne(id: string, recipientId: string): Promise<void> {
    const result = await this.prisma.notification.deleteMany({
      where: { id, recipientId },
    });

    if (result.count === 0) {
      throw new NotFoundException(`Notification ${id} not found`);
    }
  }

  async deleteAll(recipientId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.notification.deleteMany({
      where: { recipientId },
    });
  }
}
