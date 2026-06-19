import { Injectable } from '@nestjs/common';
import { Prisma, UserSettings } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserSettingsRepository {
  constructor(private prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<UserSettings | null> {
    return this.prisma.userSettings.findUnique({ where: { userId } });
  }

  async upsert(
    userId: string,
    data: Prisma.UserSettingsUpdateInput,
  ): Promise<UserSettings> {
    return this.prisma.userSettings.upsert({
      where: { userId },
      update: data,
      create: { userId },
    });
  }
}
