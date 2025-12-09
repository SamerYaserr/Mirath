import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ProfileSetupDto } from './dto/profile-setup.dto';
import { HttpResponse } from 'src/common/types/api.types';
import { UserRepository } from './repositories/user.repository';
import { InterestsRepository } from '../interests/repositories/interests.repository';
import { UserInterestsRepository } from '../interests/repositories/user-interests.repository';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private userRepository: UserRepository,
    private interestsRepository: InterestsRepository,
    private userInterestsRepository: UserInterestsRepository,
  ) {}

  async setupProfile(
    userId: string,
    profilePhoto: Express.Multer.File,
    dto: ProfileSetupDto,
  ): Promise<HttpResponse> {
    const existingInterests = await this.interestsRepository.findMany({
      where: { custom: false, name: { in: dto.interests } },
      select: {
        name: true,
      },
    });

    const existingInterestNames = new Set(existingInterests.map((i) => i.name));
    const customInterests = dto.interests.filter(
      (i) => !existingInterestNames.has(i),
    );

    const user = await this.prisma.$transaction(async (tx) => {
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

      return await this.userRepository.update(
        {
          where: { id: userId },
          data: {
            fullName: dto.name,
            levelOfEducation: dto.levelOfEducation,
            ...(dto.university && { university: dto.university }),
          },
        },
        tx,
      );
    });

    return { message: 'Profile setup completed successfully', data: user };
  }
}
