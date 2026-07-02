import { Injectable, NotFoundException } from '@nestjs/common';
import { DeviceFcmToken } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';
import { UpsertDeviceTokenPayload } from '../notification.types';

@Injectable()
export class DeviceTokensRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllByUserId(
    userId: string,
  ): Promise<
    Pick<
      DeviceFcmToken,
      'id' | 'token' | 'deviceId' | 'createdAt' | 'updatedAt'
    >[]
  > {
    return this.prisma.deviceFcmToken.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        token: true,
        deviceId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  async deleteById(id: string): Promise<void> {
    await this.prisma.deviceFcmToken.delete({
      where: { id },
    });
  }

  async deleteMany(ids: string[]): Promise<void> {
    if (ids.length === 0) return;
    await this.prisma.deviceFcmToken.deleteMany({
      where: { id: { in: ids } },
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
