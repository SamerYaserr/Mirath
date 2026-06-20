import type { Request } from 'express';
import { Controller, Get, HttpCode, HttpStatus, Req } from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';

import { HttpResponse } from 'src/common/types/api.types';
import { UserSettingsService } from './user-settings.service';
import { AppearanceResDto } from './dto/responses/appearance.res.dto';

@ApiTags('User Settings')
@ApiBearerAuth()
@Controller('users/settings')
@ApiExtraModels(AppearanceResDto)
export class UserSettingsController {
  constructor(readonly userSettingsService: UserSettingsService) {}

  @Get('appearance')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieve Reading and Appearance Settings',
    description: '',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reading and Appearance Settings retrieved successfully',
    schema: {
      properties: {
        data: {
          $ref: getSchemaPath(AppearanceResDto),
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  async get(@Req() req: Request): Promise<HttpResponse<AppearanceResDto>> {
    const userId = req.user!.id;
    return this.userSettingsService.get(userId);
  }
}
