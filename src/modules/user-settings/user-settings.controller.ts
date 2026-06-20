import type { Request } from 'express';
import { Body, Controller, HttpStatus, Patch, Post, Req } from '@nestjs/common';
import {
  ApiBody,
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
} from '@nestjs/swagger';

import { UserSettingsService } from './user-settings.service';
import { ChangeUsernameReqDto } from './dto/requests/change-username.req.dto';
import { RequestEmailChangeReqDto } from './dto/requests/request-email-change.req.dto';

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
    description: 'Username conflict errors',
    content: {
      'application/json': {
        examples: {
          sameUsername: {
            value: {
              message: 'New username is the same as the current username',
            },
          },
          alreadyTaken: {
            value: { message: 'Username is already taken' },
          },
        },
      },
    },
  })
  async updateUsername(
    @Body() dto: ChangeUsernameReqDto,
    @Req() { user }: Request,
  ) {
    return this.userSettingsService.updateUsername(dto, user!);
  }

  @Post('account/email/request-change')
  @ApiOperation({
    summary: 'Request email change',
    description: `Request to change the email of the current user. A verification code will be sent to the new email address.`,
  })
  @ApiBody({
    description: 'Request body for requesting email change',
    type: RequestEmailChangeReqDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email change requested successfully',
    schema: {
      example: {
        message: 'A verification code has been sent to your new email address',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'Email conflict errors',
    content: {
      'application/json': {
        examples: {
          sameEmail: {
            value: { message: 'New email is the same as the current email' },
          },
          alreadyUsed: {
            value: { message: 'Email is already in use' },
          },
        },
      },
    },
  })
  async requestEmailChange(
    @Body() dto: RequestEmailChangeReqDto,
    @Req() { user }: Request,
  ) {
    return this.userSettingsService.requestEmailChange(dto, user!);
  }
}
