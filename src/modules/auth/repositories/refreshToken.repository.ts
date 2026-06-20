import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RefreshTokenRepository {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, expiresAt: Date, sessionId: string) {
    return this.prisma.refreshToken.create({
      data: {
        userId,
        expiresAt,
        sessionId: sessionId,
      },
    });
  }

  async countActiveAndDeleteOldestToken(userId: string) {
    const tokens = await this.prisma.refreshToken.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: {
        createdAt: 'asc',
      },
    });

    const MAX_SESSIONS = 2;

    if (tokens.length >= MAX_SESSIONS) {
      const toDelete = tokens.slice(0, tokens.length - MAX_SESSIONS + 1);
      await this.prisma.refreshToken.deleteMany({
        where: { id: { in: toDelete.map((t) => t.id) } },
      });
    }
  }

  async deleteAllExcept(userId: string, sessionId: string) {
    await this.prisma.refreshToken.deleteMany({
      where: {
        userId,
        sessionId: { not: sessionId },
      },
    });
  }

  async deleteBySessionId(sessionId: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { sessionId },
    });
  }

  async deleteByUserId(userId: string, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    await client.refreshToken.deleteMany({
      where: { userId },
    });
  }

  async deleteById(id: string) {
    try {
      await this.prisma.refreshToken.delete({
        where: { id },
      });
    } catch (error) {
      // Token not found, ignore
    }
  }

  async findAllByUserId(userId: string) {
    return this.prisma.refreshToken.findMany({
      where: {
        userId,
        expiresAt: { gt: new Date() },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async findById(tokenId: string) {
    return this.prisma.refreshToken.findUnique({
      where: { id: tokenId },
    });
  }

  async atomicDeleteByIdAndCreate(
    userId: string,
    tokenId: string,
    expireAt: Date,
    sessionId: string,
  ) {
    return this.prisma.$transaction(async (tx) => {
      await tx.refreshToken.delete({ where: { id: tokenId } });
      return await tx.refreshToken.create({
        data: {
          userId,
          expiresAt: expireAt,
          sessionId: sessionId,
        },
      });
    });
  }
}
