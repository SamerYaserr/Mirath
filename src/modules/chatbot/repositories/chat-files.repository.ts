import { Injectable } from '@nestjs/common';
import { AttachmentType } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

type CreateChatFileData = {
  userId: string;
  type: AttachmentType;
  url: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds?: number | null;
};

@Injectable()
export default class ChatFilesRepository {
  constructor(private readonly prisma: PrismaService) {}

  create(data: CreateChatFileData) {
    return this.prisma.chatFile.create({ data });
  }

  findByIdAndUser(id: string, userId: string) {
    return this.prisma.chatFile.findFirst({ where: { id, userId } });
  }

  deleteOne(id: string) {
    return this.prisma.chatFile.delete({ where: { id } });
  }

  findAbandonedBefore(cutoff: Date) {
    return this.prisma.chatFile.findMany({
      where: { createdAt: { lt: cutoff } },
    });
  }
}
