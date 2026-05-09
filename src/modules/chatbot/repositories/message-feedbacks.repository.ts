import { FeedbackType, Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';

import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export default class MessageFeedbacksRepository {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    messageId: string,
    type: FeedbackType,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;

    const feedback = await client.messageFeedback.create({
      data: { type, messageId, userId },
    });
    return feedback;
  }

  async delete(id: string, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;

    return await client.messageFeedback.delete({ where: { id } });
  }

  async update(id: string, type: FeedbackType, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;

    return await client.messageFeedback.update({
      where: { id },
      data: { type },
    });
  }
}
