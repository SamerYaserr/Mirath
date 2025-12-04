import { Injectable } from '@nestjs/common';
import { OtpPurpose } from '@prisma/client';

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
}
