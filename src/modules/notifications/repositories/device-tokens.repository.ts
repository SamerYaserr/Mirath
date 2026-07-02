import { Injectable, NotFoundException } from '@nestjs/common';
import { DeviceFcmToken, Prisma } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { UpsertDeviceTokenPayload } from '../notification.types';

@Injectable()
export class DeviceTokensRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUserId(userId: string): Promise<DeviceFcmToken[]> {
    return this.prisma.deviceFcmToken.findMany({
      where: { userId },
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.deviceFcmToken.delete({
      where: { id },
    });
  }

  async deleteByToken(userId: string, token: string): Promise<void> {
    const result = await this.prisma.deviceFcmToken.deleteMany({
      where: { userId, token },
    });

    if (result.count === 0) {
      throw new NotFoundException('Device token not found');
    }
  }

  async deleteByUserId(userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.deviceFcmToken.deleteMany({ where: { userId } });
  }

  async upsert({
    token,
    userId,
    deviceId,
  }: UpsertDeviceTokenPayload): Promise<DeviceFcmToken> {
    return this.prisma.deviceFcmToken.upsert({
      where: { userId_token: { userId, token } },
      create: {
        userId,
        token,
        ...(deviceId !== undefined && { deviceId }),
      },
      update: {
        ...(deviceId !== undefined && { deviceId }),
      },
    });
  }
}
