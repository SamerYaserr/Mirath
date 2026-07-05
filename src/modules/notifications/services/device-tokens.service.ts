import { Injectable } from '@nestjs/common';

import { HttpResponse } from 'src/common/types/api.types';
import { RegisterOrRefreshPayload } from '../notification.types';
import { DeviceTokenResDto } from '../dto/responses/device-token.res.dto';
import { DeviceTokensRepository } from '../repositories/device-tokens.repository';
import { DeleteDeviceTokenReqDto } from '../dto/requests/delete-device-token.req.dto';

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

  async deleteByToken({
    userId,
    dto: { token },
  }: {
    userId: string;
    dto: DeleteDeviceTokenReqDto;
  }): Promise<HttpResponse> {
    await this.deviceTokensRepository.deleteByToken(userId, token);

    return {
      message: 'Device token deleted successfully',
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
