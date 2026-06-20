import { Injectable } from '@nestjs/common';

import { UserSettingsRepository } from './repositories/user-settings.repository';
import { HttpResponse } from 'src/common/types/api.types';
import { AppearanceResDto } from './dto/responses/appearance.res.dto';

@Injectable()
export class UserSettingsService {
  constructor(readonly userSettingsRepository: UserSettingsRepository) {}

  async get(userId: string): Promise<HttpResponse<AppearanceResDto>> {
    const userSettings = await this.userSettingsRepository.findByUserId(userId);

    return { data: AppearanceResDto.fromEntity(userSettings) };
  }
}
