import { Injectable } from '@nestjs/common';

import { HttpResponse } from 'src/common/types/api.types';
import { UpdateDisplayReqDto } from './dto/requests/update-display.req.dto';
import { UserSettingsRepository } from './repositories/user-settings.repository';
import { DisplaySettingsResDto } from './dto/responses/display-settings.res.dto';
import { AppearanceSettingsResDto } from './dto/responses/appearance-settings.res.dto';
import { UpdateReadingReqDto } from './dto/requests/update-reading.req.dto';
import { ReadingSettingsResDto } from './dto/responses/reading-settings.res.dto';

@Injectable()
export class UserSettingsService {
  constructor(readonly userSettingsRepository: UserSettingsRepository) {}

  async get(userId: string): Promise<HttpResponse<AppearanceSettingsResDto>> {
    const userSettings = await this.userSettingsRepository.findByUserId(userId);

    return { data: AppearanceSettingsResDto.fromEntity(userSettings) };
  }

  async updateDisplay(
    userId: string,
    dto: UpdateDisplayReqDto,
  ): Promise<HttpResponse<DisplaySettingsResDto>> {
    const updatedSettings = await this.userSettingsRepository.upsert(
      userId,
      dto,
    );
    return { data: DisplaySettingsResDto.fromEntity(updatedSettings) };
  }

  async updateReading(
    userId: string,
    dto: UpdateReadingReqDto,
  ): Promise<HttpResponse<ReadingSettingsResDto>> {
    const updatedSettings = await this.userSettingsRepository.upsert(
      userId,
      dto.toUpsert(),
    );
    return { data: ReadingSettingsResDto.fromEntity(updatedSettings) };
  }
}
