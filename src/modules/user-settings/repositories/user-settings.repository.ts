import { Injectable } from '@nestjs/common';
import { Prisma, UserSettings } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

export type UserSettingsWithInterests = Prisma.UserSettingsGetPayload<{
  include: { recommendationInterests: { include: { interest: true } } };
}>;

@Injectable()
export class UserSettingsRepository {
  constructor(private prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<UserSettings | null> {
    return this.prisma.userSettings.findUnique({ where: { userId } });
  }

  async upsert(
    userId: string,
    data: Omit<
      Prisma.UserSettingsUncheckedCreateInput,
      'id' | 'userId' | 'createdAt' | 'updatedAt'
    >,
  ): Promise<UserSettings> {
    return this.prisma.userSettings.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data },
    });
  }

  async findSettingsWithInterests(
    userId: string,
  ): Promise<UserSettingsWithInterests | null> {
    return this.prisma.userSettings.findUnique({
      where: { userId },
      include: {
        recommendationInterests: { include: { interest: true } },
      },
    });
  }

  async replaceInterests(
    userId: string,
    newInterestsNames: string[],
  ): Promise<UserSettingsWithInterests | null> {
    const uniqueNames = [...new Set(newInterestsNames)];

    const settings = await this.findByUserId(userId);
    let settingsId = settings?.id;

    if (!settingsId) {
      const newSettings = await this.upsert(userId, {});
      settingsId = newSettings.id;
    }

    await this.prisma.$transaction(async (tx) => {
      const existingInterests = await tx.interest.findMany({
        where: { name: { in: uniqueNames } },
        select: { id: true, name: true },
      });
      const existingNames = new Set(existingInterests.map((i) => i.name));

      const customNames = uniqueNames.filter((n) => !existingNames.has(n));

      if (customNames.length > 0) {
        await tx.interest.createMany({
          data: customNames.map((n) => ({ name: n, custom: true })),
        });
      }

      const allInterests = await tx.interest.findMany({
        where: { name: { in: uniqueNames } },
        select: { id: true, name: true },
      });

      await tx.recommendationInterest.deleteMany({
        where: { settingsId },
      });

      if (allInterests.length > 0) {
        await tx.recommendationInterest.createMany({
          data: allInterests.map((i) => ({
            settingsId: settingsId!,
            interestId: i.id,
          })),
        });
      }
    });

    return this.findSettingsWithInterests(userId);
  }
}
