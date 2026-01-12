import { Injectable } from '@nestjs/common';
import { Prisma, User, UserStatus } from '@prisma/client';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class UserRepository {
  constructor(private prisma: PrismaService) {}

  async create(data: Prisma.UserCreateInput): Promise<User> {
    return this.prisma.user.create({ data });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { email } });
  }

  async findById(id: string): Promise<User | null> {
    return this.prisma.user.findUnique({ where: { id } });
  }

  async findByEmailOrUsername(
    email: string,
    username: string,
  ): Promise<User | null> {
    return this.prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });
  }

  async updateStatus(id: string, status: UserStatus): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { status },
    });
  }

  async updatePassword(id: string, password: string): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { password },
    });
  }

  async updateGoogleProvider(
    id: string,
    providerId: string,
    photoUrl: string,
  ): Promise<User> {
    return this.prisma.user.update({
      where: { id },
      data: { providerId, photoUrl },
    });
  }

  async update(args: Prisma.UserUpdateArgs, tx?: Prisma.TransactionClient) {
    const client = tx || this.prisma;
    return await client.user.update(args);
  }

  async findProfileById(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        fullName: true,
        photoUrl: true,
        bio: true,
        birthDate: true,
        country: true,
        levelOfEducation: true,
        university: true,
        role: true,
        status: true,
        isEmailVisible: true,
        isPremium: true,
        createdAt: true,
        updatedAt: true,
        userInterests: {
          select: {
            interest: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
        userFields: {
          select: {
            field: {
              select: {
                id: true,
                name: true,
              },
            },
          },
        },
      },
    });
  }
}
