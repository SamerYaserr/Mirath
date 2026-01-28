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

  async findFollowers(userId: string, skip: number, take: number) {
    return await this.prisma.follows.findMany({
      where: { followingId: userId },
      skip,
      take,
      include: {
        follower: {
          select: {
            id: true,
            username: true,
            fullName: true,
            photoUrl: true,
            bio: true,
            role: true,
            status: true,
            isPremium: true,
          },
        },
      },
    });
  }

  async findFollowings(userId: string, skip: number, take: number) {
    return await this.prisma.follows.findMany({
      where: { followerId: userId },
      skip,
      take,
      include: {
        following: {
          select: {
            id: true,
            username: true,
            fullName: true,
            photoUrl: true,
            bio: true,
            role: true,
            isPremium: true,
          },
        },
      },
    });
  }

  async findMany(followerId: string, followingIds: string[]) {
    return await this.prisma.follows.findMany({
      where: {
        followerId,
        followingId: { in: followingIds },
      },
      select: { followingId: true },
    });
  }

  async delete(followerId: string, followingId: string) {
    await this.prisma.follows.delete({
      where: { followerId_followingId: { followerId, followingId } },
    });
  }
}
