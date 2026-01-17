import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/modules/prisma/prisma.service';

@Injectable()
export class FollowsRepository {
  constructor(private prisma: PrismaService) {}

  async create(followerId: string, followingId: string) {
    await this.prisma.follows.create({ data: { followerId, followingId } });
  }

  async find(followerId: string, followingId: string) {
    return await this.prisma.follows.findUnique({
      where: { followerId_followingId: { followerId, followingId } },
    });
  }

  async delete(followerId: string, followingId: string) {
    await this.prisma.follows.delete({
      where: { followerId_followingId: { followerId, followingId } },
    });
  }
}
