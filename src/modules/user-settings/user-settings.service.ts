import { User } from '@prisma/client';
import { ConflictException, Injectable } from '@nestjs/common';

import { AuthService } from '../auth/auth.service';
import { OtpRepository } from '../auth/repositories/otp.repository';
import { UsersRepository } from '../users/repositories/users.repository';
import { UserSettingsRepository } from './repositories/user-settings.repository';

@Injectable()
export class UserSettingsService {
  constructor(
    private readonly authService: AuthService,
    private readonly otpRepository: OtpRepository,
    private readonly userRepository: UsersRepository,
    readonly userSettingsRepository: UserSettingsRepository,
  ) {}

  async updateUsername(
    dto: { newUsername: string },
    { id: userId, username }: User,
  ) {
    if (dto.newUsername === username) {
      throw new ConflictException(
        'New username is the same as the current username',
      );
    }

    const user = await this.userRepository.findByEmailOrUsername({
      email: '',
      username: dto.newUsername,
      where: { id: { not: userId } },
      select: { id: true },
    });

    if (user) {
      throw new ConflictException('Username is already taken');
    }

    await this.userRepository.update({
      where: { id: userId },
      data: { username: dto.newUsername },
    });

    return { message: 'Username updated successfully' };
  }

  async requestEmailChange(
    dto: { newEmail: string },
    { id: userId, email }: User,
  ) {
    if (dto.newEmail === email) {
      throw new ConflictException('New email is the same as the current email');
    }

    const user = await this.userRepository.findByEmail({
      email: dto.newEmail,
      where: { id: { not: userId } },
    });

    if (user) {
      throw new ConflictException('Email is already taken');
    }

    await this.otpRepository.invalidatePendingOtps(userId, 'EMAIL_CHANGE');
    await this.authService.generateAndSendOtp(
      userId,
      dto.newEmail,
      'EMAIL_CHANGE',
    );

    return {
      message: 'A verification code has been sent to your new email address',
    };
  }
}
