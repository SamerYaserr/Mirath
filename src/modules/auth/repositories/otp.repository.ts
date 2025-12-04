import { Injectable } from '@nestjs/common';
import { OtpPurpose, OtpVerification } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class OtpRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: {
    userId: string;
    otpCode: string;
    purpose: OtpPurpose;
    expiresAt: Date;
  }) {
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

  async markAsUsed(id: string): Promise<void> {
    await this.prisma.otpVerification.update({
      where: { id },
      data: { isUsed: true },
    });
  }
}
