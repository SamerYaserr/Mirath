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

  async findValidOtp(
    userId: string,
    otpCode: string,
    purpose: OtpPurpose,
  ): Promise<OtpVerification | null> {
    return this.prisma.otpVerification.findFirst({
      where: {
        userId,
        otpCode,
        purpose,
        isUsed: false,
        expiresAt: { gt: new Date() }, // Query filters expired OTPs automatically
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
