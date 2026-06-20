import { ConflictException, Injectable } from '@nestjs/common';

import { UserSettingsRepository } from './repositories/user-settings.repository';
import { UsersRepository } from '../users/repositories/users.repository';

@Injectable()
export class UserSettingsService {
  constructor(
    private readonly userRepository: UsersRepository,
    readonly userSettingsRepository: UserSettingsRepository,
  ) {}

  async updateUsername(dto: { newUsername: string }, userId: string) {
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
}
