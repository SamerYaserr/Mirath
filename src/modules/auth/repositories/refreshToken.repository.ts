import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class RefreshTokenRepository {
  constructor(private prisma: PrismaService) {}

  async create(userId: string, expiresAt: Date, sessionId?: string) {
    return this.prisma.refreshToken.create({
      data: {
        userId,
        expiresAt,
        sessionId: sessionId ?? null,
      },
    });
  }
}
