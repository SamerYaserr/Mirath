import { Injectable } from '@nestjs/common';

import { HttpResponse } from 'src/common/types/api.types';
import { RegisterOrRefreshPayload } from './notification.types';
import { DeviceTokensRepository } from './repositories/device-tokens.repository';
import { DeviceTokenResDto } from './dto/responses/device-token.res.dto';

@Injectable()
export class DeviceTokensService {
  constructor(
    private readonly deviceTokensRepository: DeviceTokensRepository,
  ) {}

  async findAll(userId: string): Promise<HttpResponse<DeviceTokenResDto[]>> {
    const deviceTokens =
      await this.deviceTokensRepository.findAllByUserId(userId);

    return {
      size: deviceTokens.length,
      data: deviceTokens.map((deviceToken) =>
        DeviceTokenResDto.fromEntity(deviceToken),
      ),
    };
  }

  async registerOrRefresh({
    userId,
    dto: { token, deviceId },
  }: RegisterOrRefreshPayload): Promise<HttpResponse<DeviceTokenResDto>> {
    const deviceToken = await this.deviceTokensRepository.upsert({
      userId,
      token,
      deviceId,
    });

    return {
      data: DeviceTokenResDto.fromEntity(deviceToken),
    };
  }
}
