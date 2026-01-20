import { User, UserStatus } from '@prisma/client';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileSetupDto } from './dto/profile-setup.dto';
import { HttpResponse } from 'src/common/types/api.types';
import { UsersRepository } from './repositories/users.repository';
import { winstonLogger as logger } from 'src/config/logger.config';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { InterestsRepository } from '../interests/repositories/interests.repository';
import { UserInterestsRepository } from '../interests/repositories/user-interests.repository';
import { excludeUserSensitiveFields } from 'src/common/utils/user.utils';
import { FollowsRepository } from './repositories/follows.repository';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private usersRepository: UsersRepository,
    private cloudinaryService: CloudinaryService,
    private followsRepository: FollowsRepository,
    private interestsRepository: InterestsRepository,
    private userInterestsRepository: UserInterestsRepository,
  ) {}

  async setupProfile(
    userId: string,
    profilePhoto: Express.Multer.File,
    dto: ProfileSetupDto,
  ): Promise<HttpResponse> {
    const existingInterests = await this.interestsRepository.findMany({
      where: { name: { in: dto.interests } },
      select: {
        name: true,
      },
    });

    const existingInterestNames = new Set(existingInterests.map((i) => i.name));
    const customInterests = dto.interests.filter(
      (i) => !existingInterestNames.has(i),
    );

    let secureUrl = null;
    if (profilePhoto)
      secureUrl = (await this.cloudinaryService.uploadFile(profilePhoto))
        .secure_url;

    let user: User | null = null;
    try {
      user = await this.prisma.$transaction(async (tx) => {
        if (customInterests.length)
          await this.interestsRepository.createMany(
            customInterests.map((c) => ({ name: c, custom: true })),
            tx,
          );

        const userInterestIds = await this.interestsRepository.findMany(
          {
            where: { name: { in: dto.interests } },
            select: { id: true },
          },
          tx,
        );

        await this.userInterestsRepository.createMany(
          userInterestIds.map((ui) => ({ userId, interestId: ui.id })),
          tx,
        );

        return await this.usersRepository.update(
          {
            where: { id: userId },
            data: {
              fullName: dto.name,
              status: UserStatus.ACTIVE,
              levelOfEducation: dto.levelOfEducation,
              ...(secureUrl && { photoUrl: secureUrl }),
              ...(dto.university && { university: dto.university }),
            },
          },
          tx,
        );
      });
    } catch (error) {
      logger.error(
        `Database transaction to finish user ${userId} profile setup failed`,
        { error: error },
      );
      if (secureUrl) await this.cloudinaryService.deleteFile(secureUrl);

      throw error;
    }

    return {
      message: 'Profile setup completed successfully',
      data: excludeUserSensitiveFields(user),
    };
  }

  async getMyProfile(userId: string): Promise<HttpResponse> {
    const user = await this.usersRepository.findProfileById(userId);

    if (!user) throw new NotFoundException('User not found');

    const { userInterests, userFields, _count, ...userData } = user;

    const formattedProfile = {
      ...userData,
      interests: userInterests.map((ui) => ui.interest),
      fieldsOfStudy: userFields.map((uf) => uf.field),
      followersCount: _count.followers,
      followingCount: _count.followings,
    };

    return {
      message: 'User profile retrieved successfully',
      data: formattedProfile,
    };
  }

  async follow(followerId: string, followingId: string): Promise<HttpResponse> {
    if (followerId === followingId)
      throw new BadRequestException('You cannot follow yourself');

    await this.checkUserExistance(followingId);

    // Only create the relationship if there was no one
    if (!(await this.checkFollowRelationship(followerId, followingId)))
      await this.followsRepository.create(followerId, followingId);

    return {
      message: 'User followed successfully',
    };
  }

  async unfollow(
    followerId: string,
    followingId: string,
  ): Promise<HttpResponse> {
    if (followerId === followingId)
      throw new BadRequestException('You cannot unfollow yourself');

    await this.checkUserExistance(followingId);

    // Only remove the relationship if there was already one
    if (await this.checkFollowRelationship(followerId, followingId))
      await this.followsRepository.delete(followerId, followingId);

    return {
      message: 'User unfollowed successfully',
    };
  }

  // ============ Helpers ============ //

  async checkUserExistance(id: string) {
    const user = await this.usersRepository.findById(id);
    if (!user) throw new NotFoundException('User not found');
  }

  async checkFollowRelationship(
    followerId: string,
    followingId: string,
  ): Promise<boolean> {
    return !!(await this.followsRepository.find(followerId, followingId));
  }
}
