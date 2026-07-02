import {
  Req,
  Body,
  Get,
  Post,
  HttpCode,
  Controller,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBody,
  ApiResponse,
  ApiOperation,
  getSchemaPath,
  ApiBearerAuth,
  ApiExtraModels,
} from '@nestjs/swagger';
import { type Request } from 'express';

import { HttpResponse } from 'src/common/types/api.types';
import { DeviceTokensService } from '../device-tokens.service';
import { RegisterDeviceTokenReqDto } from '../dto/requests/register-device-token.req.dto';
import { DeviceTokenResDto } from '../dto/responses/device-token.res.dto';

@ApiTags('Device Tokens')
@ApiBearerAuth()
@ApiExtraModels(DeviceTokenResDto)
@Controller('users/notifications/tokens')
export class DeviceTokensController {
  constructor(private readonly deviceTokensService: DeviceTokensService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Register or refresh a device token for push notifications',
  })
  @ApiBody({ type: RegisterDeviceTokenReqDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Device token registered or refreshed successfully.',
    schema: {
      properties: {
        data: { $ref: getSchemaPath(DeviceTokenResDto) },
      },
    },
  })
  async registerOrRefresh(
    @Req() req: Request,
    @Body() dto: RegisterDeviceTokenReqDto,
  ): Promise<HttpResponse<DeviceTokenResDto>> {
    return this.deviceTokensService.registerOrRefresh({
      userId: req.user!.id,
      dto,
    });
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List all registered device tokens' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Registered device tokens fetched successfully.',
    schema: {
      properties: {
        size: { type: 'number', example: 2 },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(DeviceTokenResDto) },
        },
      },
    },
  })
  async findAll(
    @Req() req: Request,
  ): Promise<HttpResponse<DeviceTokenResDto[]>> {
    return this.deviceTokensService.findAll(req.user!.id);
  }
}
