import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { UserStatus } from '@prisma/client';

@Injectable()
export class SearchRepository {
  constructor(private prisma: PrismaService) {}

  async searchDiscussions(
    userId: string,
    query: string,
    skip: number,
    take: number,
  ) {
    return this.prisma.discussion.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
        ],
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            username: true,
            photoUrl: true,
            followings: {
              where: { followerId: userId },
              select: { followerId: true },
            },
          },
        },
        topics: {
          include: {
            interest: true,
          },
        },
      },
      orderBy: { upvoteCount: 'desc' },
      skip,
      take,
    });
  }

  async searchReadingLists(
    userId: string,
    query: string,
    skip: number,
    take: number,
  ) {
    return this.prisma.readingList.findMany({
      where: {
        title: { contains: query, mode: 'insensitive' },
        OR: [
          { isPublic: true },
          { ownerId: userId },
          { savedReadingLists: { some: { userId } } },
        ],
      },
      include: {
        owner: {
          select: {
            id: true,
            fullName: true,
            username: true,
            photoUrl: true,
            followings: {
              where: { followerId: userId },
              select: { followerId: true },
            },
          },
        },
        _count: {
          select: { papers: true },
        },

        savedReadingLists: {
          where: { userId },
          select: { userId: true },
        },
      },
      orderBy: { updatedAt: 'desc' },
      skip,
      take,
    });
  }

  async searchResearchers(
    currentUserId: string,
    query: string,
    skip: number,
    take: number,
  ) {
    return this.prisma.user.findMany({
      where: {
        status: UserStatus.ACTIVE,
        settings: {
          allowProfileSearch: true,
        },
        OR: [
          { username: { contains: query, mode: 'insensitive' } },
          { fullName: { contains: query, mode: 'insensitive' } },
          { bio: { contains: query, mode: 'insensitive' } },
        ],
      },
      select: {
        id: true,
        fullName: true,
        username: true,
        photoUrl: true,
        bio: true,
        country: true,
        levelOfEducation: true,
        university: true,

        followings: {
          where: { followerId: currentUserId },
          select: { followerId: true },
        },
      },
      skip,
      take,
    });
  }
}
