import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class UserInterestsRepository {
  constructor(private prisma: PrismaService) {}

  async createMany(
    data: Prisma.UserInterestUncheckedCreateInput[],
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return await client.userInterest.createMany({ data });
  }

  async deleteByUserId(userId: string, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    return await client.userInterest.deleteMany({ where: { userId } });
  }
}
