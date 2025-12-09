import { Prisma } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class InterestsRepository {
  constructor(private prisma: PrismaService) {}

  async findMany(
    args: Prisma.InterestFindManyArgs,
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return await client.interest.findMany(args);
  }

  async createMany(
    data: Prisma.InterestCreateManyInput[],
    tx?: Prisma.TransactionClient,
  ) {
    const client = tx || this.prisma;
    return await client.interest.createMany({ data });
  }
}
