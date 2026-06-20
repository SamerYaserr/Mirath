import { Injectable } from '@nestjs/common';
import { OtpPurpose, OtpVerification, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OtpRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.OtpVerificationUncheckedCreateInput) {
    return this.prisma.otpVerification.create({ data });
  }

  async findPendingOtp(
    userId: string,
    purpose: OtpPurpose,
  ): Promise<OtpVerification | null> {
    return this.prisma.otpVerification.findFirst({
      where: {
        userId,
        purpose,
        isUsed: false,
        expiresAt: { gt: new Date() },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async markAsUsed(id: string, tx?: Prisma.TransactionClient): Promise<void> {
    const client = tx || this.prisma;
    await client.otpVerification.update({
      where: { id },
      data: { isUsed: true },
    });
  }

  async countRecentOtps(
    userId: string,
    purpose: OtpPurpose,
    since: Date,
  ): Promise<number> {
    return this.prisma.otpVerification.count({
      where: {
        userId,
        purpose,
        createdAt: { gte: since },
      },
    });
  }

  async invalidatePendingOtps(
    userId: string,
    purpose: OtpPurpose,
  ): Promise<void> {
    await this.prisma.otpVerification.updateMany({
      where: {
        userId,
        purpose,
        isUsed: false,
      },
      data: { isUsed: true },
    });
  }
}
