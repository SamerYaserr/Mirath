import { Injectable } from '@nestjs/common';

import { HttpResponse } from 'src/common/types/api.types';
import { RegisterOrRefreshPayload } from './notification.types';
import { DeviceTokensRepository } from './repositories/device-tokens.repository';
import { RegisterDeviceTokenResDto } from './dto/responses/device-token.res.dto';

@Injectable()
export class DeviceTokensService {
  constructor(
    private readonly deviceTokensRepository: DeviceTokensRepository,
  ) {}

  async registerOrRefresh({
    userId,
    dto: { token, deviceId },
  }: RegisterOrRefreshPayload): Promise<
    HttpResponse<RegisterDeviceTokenResDto>
  > {
    const deviceToken = await this.deviceTokensRepository.upsert({
      userId,
      token,
      deviceId,
    });

    return {
      data: RegisterDeviceTokenResDto.fromEntity(deviceToken),
    };
  }
}
