import type { Request } from 'express';
import { Body, Controller, HttpStatus, Patch, Req } from '@nestjs/common';
import {
  ApiBody,
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { UserSettingsService } from './user-settings.service';
import { ChangeUsernameReqDto } from './dto/requests/change-username.req.dto';

@ApiTags('User Settings')
@ApiBearerAuth()
@Controller('users/settings')
export class UserSettingsController {
  constructor(readonly userSettingsService: UserSettingsService) {}

  @Patch('account/username')
  @ApiOperation({
    summary: 'Change username',
    description: `Change the username of the current user. The new username must be unique and cannot contain the "@" symbol.`,
  })
  @ApiBody({
    description: 'Request body for changing the username',
    type: ChangeUsernameReqDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Username updated successfully',
    schema: {
      example: { message: 'Username updated successfully' },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Username is already taken',
    schema: {
      example: { message: 'Username is already taken' },
    },
  })
  async updateUsername(
    @Body() dto: ChangeUsernameReqDto,
    @Req() { user }: Request,
  ) {
    return this.userSettingsService.updateUsername(dto, user!.id);
  }
}
