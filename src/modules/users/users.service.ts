import { User, UserStatus } from '@prisma/client';
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileSetupReqDto } from './dto/requests/profile-setup.req.dto';
import { HttpResponse } from 'src/common/types/api.types';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { UsersRepository } from './repositories/users.repository';
import { winstonLogger as logger } from 'src/config/logger.config';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { InterestsRepository } from '../interests/repositories/interests.repository';
import { UserInterestsRepository } from '../interests/repositories/user-interests.repository';
import { excludeUserSensitiveFields } from 'src/common/utils/user.utils';
import { FollowsRepository } from './repositories/follows.repository';
import { FormattedProfile } from './user.types';
import { ProfileResDto } from './dto/responses/profile.res.dto';

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
    dto: ProfileSetupReqDto,
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

  async getMyProfile(userId: string): Promise<HttpResponse<FormattedProfile>> {
    const profile = await this._getFormattedProfile(userId);

    return {
      data: profile,
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

  async getFollowers(
    userId: string,
    viewerId: string,
    pagination: PaginationDto,
  ): Promise<HttpResponse> {
    await this.checkUserExistance(userId);

    const followers = await this.followsRepository.findFollowers(
      userId,
      pagination.skip,
      pagination.limit,
    );

    const followerIds = followers.map((f) => f.follower.id);
    const followingSet = await this.getFollowingSet(viewerId, followerIds);

    const formattedFollowers = followers.map((f) => ({
      ...f.follower,
      isFollowing: followingSet.has(f.follower.id),
    }));

    return {
      message: 'Followers retrieved successfully',
      data: formattedFollowers,
    };
  }

  async getFollowing(
    userId: string,
    viewerId: string,
    pagination: PaginationDto,
  ): Promise<HttpResponse> {
    await this.checkUserExistance(userId);

    const followings = await this.followsRepository.findFollowings(
      userId,
      pagination.skip,
      pagination.limit,
    );

    const followingIds = followings.map((f) => f.following.id);
    const followingSet = await this.getFollowingSet(viewerId, followingIds);

    const formattedFollowings = followings.map((f) => ({
      ...f.following,
      isFollowing: followingSet.has(f.following.id),
    }));

    return {
      message: 'Following retrieved successfully',
      data: formattedFollowings,
    };
  }

  async getProfile(
    currentUserId: string,
    targetUserId: string,
  ): Promise<HttpResponse<{ profile: ProfileResDto }>> {
    const profile = await this._getFormattedProfile(targetUserId);

    const isMe = currentUserId === targetUserId;
    if (!isMe && !profile.isEmailVisible) {
      profile.email = '';
    }

    let isFollowing = false;
    if (!isMe)
      isFollowing = !!(await this.followsRepository.find(
        currentUserId,
        targetUserId,
      ));

    const data = {
      ...profile,
      isMe,
      isFollowing,
    };

    return {
      message: 'Profile retrieved successfully',
      data: { profile: ProfileResDto.fromDomain(data) },
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

  async getFollowingSet(
    viewerId: string,
    targetIds: string[],
  ): Promise<Set<string>> {
    if (!targetIds.length) return new Set();

    const follows = await this.followsRepository.findMany(viewerId, targetIds);
    return new Set(follows.map((f) => f.followingId));
  }

  async _getFormattedProfile(userId: string): Promise<FormattedProfile> {
    const user = await this.usersRepository.findProfileById(userId);
    if (!user) throw new NotFoundException('User not found');

    const { userInterests, userFields, _count, ...userData } = user;

    const formattedProfile: FormattedProfile = {
      ...userData,
      interests: userInterests.map((ui) => ui.interest),
      fieldsOfStudy: userFields.map((uf) => uf.field),
      followersCount: _count.followers,
      followingCount: _count.followings,
    };

    return formattedProfile;
  }
}
