import type { Request } from 'express';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Req,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
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
import { AppearanceSettingsResDto } from './dto/responses/appearance-settings.res.dto';
import { UpdateDisplayReqDto } from './dto/requests/update-display.req.dto';
import { DisplaySettingsResDto } from './dto/responses/display-settings.res.dto';
import { UpdateReadingReqDto } from './dto/requests/update-reading.req.dto';
import { ReadingSettingsResDto } from './dto/responses/reading-settings.res.dto';

@ApiTags('User Settings')
@ApiBearerAuth()
@Controller('users/settings/appearance')
@ApiExtraModels(AppearanceSettingsResDto, DisplaySettingsResDto)
@ApiUnauthorizedResponse({ description: 'User not logged in.' })
export class UserSettingsController {
  constructor(readonly userSettingsService: UserSettingsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieve Reading and Appearance Settings',
    description:
      'Returns the current appearance and reading preferences for the authenticated user, including color mode, font size, reading list visibility, and annotation highlight colors. If no settings have been configured, schema defaults are returned.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reading and Appearance Settings retrieved successfully',
    schema: {
      properties: {
        data: {
          $ref: getSchemaPath(AppearanceSettingsResDto),
        },
      },
    },
  })
  async get(
    @Req() req: Request,
  ): Promise<HttpResponse<AppearanceSettingsResDto>> {
    const userId = req.user!.id;
    return this.userSettingsService.get(userId);
  }

  @Patch('display')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Theme and Font Display Preferences',
    description:
      'Updates the color mode and font size preferences for the authenticated user. At least one field must be provided.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Theme and Font Display Preferences updated successfully',
    schema: {
      properties: {
        data: {
          $ref: getSchemaPath(DisplaySettingsResDto),
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'At least one field must be provided.',
  })
  updateDisplay(@Req() req: Request, @Body() dto: UpdateDisplayReqDto) {
    const userId = req.user!.id;
    return this.userSettingsService.updateDisplay(userId, dto);
  }

  @Patch('reading')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Reading List Visibility and Annotation Color Palette',
    description: '',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Reading List Visibility and Annotation Color Palette updated successfully',
    schema: {
      properties: {
        data: {
          $ref: getSchemaPath(ReadingSettingsResDto),
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'At least one field must be provided.',
  })
  updateReading(@Req() req: Request, @Body() dto: UpdateReadingReqDto) {
    const userId = req.user!.id;
    return this.userSettingsService.updateReading(userId, dto);
  }
}
