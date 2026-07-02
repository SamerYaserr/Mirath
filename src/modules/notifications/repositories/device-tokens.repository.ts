import { Injectable } from '@nestjs/common';
import { DeviceFcmToken } from '@prisma/client';

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
