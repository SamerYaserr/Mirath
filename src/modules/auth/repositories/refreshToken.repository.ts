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

    if (tokens.length >= 2) {
      await this.prisma.refreshToken.delete({
        where: { id: tokens[0]!.id },
      });
    }
  }

  async deleteBySessionId(sessionId: string) {
    await this.prisma.refreshToken.deleteMany({
      where: { sessionId },
    });
  }

  async deleteById(id: string) {
    await this.prisma.refreshToken.delete({
      where: { id },
    });
  }

  async findById(tokenId: string) {
    return await this.prisma.refreshToken.findUnique({
      where: { id: tokenId },
    });
  }
}
