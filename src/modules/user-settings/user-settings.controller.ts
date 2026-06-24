import type { Request, Response } from 'express';
import {
  Req,
  Res,
  Get,
  Body,
  Post,
  Patch,
  HttpCode,
  HttpStatus,
  Controller,
  Delete,
  Put,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiBody,
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
  getSchemaPath,
  ApiExtraModels,
  ApiForbiddenResponse,
} from '@nestjs/swagger';

import { HttpResponse } from 'src/common/types/api.types';
import { UserSettingsService } from './user-settings.service';
import { AppearanceSettingsResDto } from './dto/responses/appearance-settings.res.dto';
import { UpdateDisplayReqDto } from './dto/requests/update-display.req.dto';
import { DisplaySettingsResDto } from './dto/responses/display-settings.res.dto';
import { UpdateReadingReqDto } from './dto/requests/update-reading.req.dto';
import { ReadingSettingsResDto } from './dto/responses/reading-settings.res.dto';
import { ConfirmEmailReqDto } from './dto/requests/confirm-email.req.dto';
import { ChangeUsernameReqDto } from './dto/requests/change-username.req.dto';
import { UpdatePasswordReqDto } from './dto/requests/update-password.req.dto';
import { clearRefreshTokenCookie } from 'src/common/utils/clear-cookie.utils';
import { RequestEmailChangeReqDto } from './dto/requests/request-email-change.req.dto';
import { AccountSessionResDto } from './dto/responses/account-session.res.dto';
import { FeedSettingsResDto } from './dto/responses/feed-settings.res.dto';
import { UpdateFeedPreferencesReqDto } from './dto/requests/update-feed.req.dto';
import { ReplaceInterestsReqDto } from './dto/requests/replace-interests.req.dto';
import { NotificationPreferencesResDto } from './dto/responses/notification-preferences.res.dto';
import { UpdateNotificationsReqDto } from './dto/requests/update-notifications.req.dto';
import { DeactivateReqDto } from './dto/requests/deactivate.req.dto';

@ApiTags('User Settings')
@ApiBearerAuth()
@Controller('users/settings')
@ApiExtraModels(
  AccountSessionResDto,
  DisplaySettingsResDto,
  AppearanceSettingsResDto,
  ReadingSettingsResDto,
  FeedSettingsResDto,
  NotificationPreferencesResDto,
)
@ApiUnauthorizedResponse({ description: 'User not logged in.' })
export class UserSettingsController {
  constructor(private readonly userSettingsService: UserSettingsService) {}

  @Get('appearance')
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

  @Patch('appearance/display')
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

  @Patch('appearance/reading')
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
  @HttpCode(HttpStatus.OK)
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

  @Post('account/email/confirm-change')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Confirm email change',
    description: `Confirm the change of the email for the current user using the provided OTP.`,
  })
  @ApiBody({
    description: 'Request body for confirming email change',
    type: ConfirmEmailReqDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Email updated successfully',
    schema: {
      example: { message: 'Email updated successfully' },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid or expired OTP',
    schema: {
      example: { message: 'Invalid or expired OTP' },
    },
  })
  async confirmEmailChange(
    @Body() dto: ConfirmEmailReqDto,
    @Req() { user }: Request,
  ) {
    return this.userSettingsService.confirmEmailChange(dto, user!);
  }

  @Patch('account/password')
  @ApiOperation({
    summary: 'Update account password',
  })
  @ApiBody({
    description: 'Request body for updating password',
    type: UpdatePasswordReqDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Password updated - all other sessions have been revoked',
    schema: {
      example: {
        message:
          'Password updated successfully. You have been logged out of all other devices.',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Account without password set (Google-only account)',
    schema: {
      example: {
        message:
          'This account uses Google sign-in and has no password to update.',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'Current password is incorrect',
    schema: {
      example: { message: 'Current password is incorrect' },
    },
  })
  async updatePassword(
    @Req() { user }: Request,
    @Body() dto: UpdatePasswordReqDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.userSettingsService.updatePassword(dto, user!);
    clearRefreshTokenCookie(res);

    return result;
  }

  @Delete('account/linked/google')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Disconnect linked Google account',
    description: `Unlinks the Google account from the current user. Requires a password to be set first to prevent lockout.`,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Google account unlinked successfully',
    schema: {
      example: { message: 'Google account unlinked successfully' },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Password not set',
    schema: {
      example: {
        message:
          'Set a password first to avoid being locked out of your account.',
      },
    },
  })
  async unlinkGoogle(@Req() { user }: Request) {
    return this.userSettingsService.unlinkGoogle(user!);
  }

  @Get('account/sessions')
  @ApiOperation({
    summary: 'Retrieve all active sessions',
    description: 'Returns all active sessions for the current user',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Active sessions retrieved successfully',
    schema: {
      properties: {
        size: { type: 'number', example: 2 },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(AccountSessionResDto) },
        },
      },
    },
  })
  async getSessions(@Req() { user, sessionId }: Request) {
    return this.userSettingsService.getSessions(user!.id, sessionId!);
  }

  @Delete('account/sessions')
  @ApiOperation({
    summary: 'Revoke all sessions except the current one',
    description:
      'Revokes all active sessions for the current user except the current session, effectively logging out all other devices.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully logged out from all other devices',
    schema: {
      example: { message: 'Successfully logged out from all other devices' },
    },
  })
  async revokeAllSessions(@Req() { user, sessionId }: Request) {
    return this.userSettingsService.revokeAllSessions(user!.id, sessionId!);
  }

  @Post('account/deactivate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: "Deactivate user's account",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Account deactivated successfully.',
    schema: {
      example: {
        message:
          'Account successfully deactivated. You can log in anytime to reactivate.',
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Google-authenticated accounts cannot use this flow.',
  })
  @ApiForbiddenResponse({ description: 'Incorrect password.' })
  async deactivate(
    @Req() { user }: Request,
    @Body() dto: DeactivateReqDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.userSettingsService.deactivate(user!.id, dto);
    clearRefreshTokenCookie(res);

    return result;
  }

  @Get('feed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieve Feed and AI Preferences',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Feed and AI preferences retrieved successfully',
    schema: {
      properties: {
        data: {
          $ref: getSchemaPath(FeedSettingsResDto),
        },
      },
    },
  })
  async getFeedSettings(@Req() req: Request) {
    const userId = req.user!.id;
    return this.userSettingsService.getFeedSettings(userId);
  }

  @Patch('feed')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Feed and AI Preferences',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Feed and AI preferences updated successfully',
    schema: {
      properties: {
        data: {
          $ref: getSchemaPath(FeedSettingsResDto),
        },
      },
    },
  })
  updateFeedSettings(
    @Req() req: Request,
    @Body() dto: UpdateFeedPreferencesReqDto,
  ) {
    const userId = req.user!.id;
    return this.userSettingsService.updateFeedSettings(userId, dto);
  }

  @Get('feed/interests')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieve Research Interests',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Research interests retrieved successfully',
    schema: {
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
            },
          },
        },
      },
    },
  })
  getResearchInterests(@Req() req: Request) {
    const userId = req.user!.id;
    return this.userSettingsService.getResearchInterests(userId);
  }

  @Put('feed/interests')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Replace Research Interests',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Research interests replaced successfully',
    schema: {
      properties: {
        data: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              name: { type: 'string' },
            },
          },
        },
      },
    },
  })
  replaceResearchInterests(
    @Req() req: Request,
    @Body() dto: ReplaceInterestsReqDto,
  ) {
    const userId = req.user!.id;
    return this.userSettingsService.replaceResearchInterests(userId, dto);
  }

  @Get('notifications')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Retrieve Notification Preferences',
    description:
      'Returns all notification preference toggles for the authenticated user, grouped into research, social, and system sections. Security alerts are always enabled and hardcoded to true.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification preferences retrieved successfully',
    schema: {
      properties: {
        data: {
          $ref: getSchemaPath(NotificationPreferencesResDto),
        },
      },
    },
  })
  getNotificationPreferences(@Req() { user }: Request) {
    return this.userSettingsService.getNotificationPreferences(user!.id);
  }

  @Patch('notifications')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update Notification Preferences',
    description:
      'Updates one or more notification preference toggles. Only the fields present in the request body are updated; omitted fields remain unchanged. The securityAlerts field is always true and cannot be modified.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Notification preferences updated successfully',
    schema: {
      properties: {
        data: {
          $ref: getSchemaPath(NotificationPreferencesResDto),
        },
      },
    },
  })
  updateNotificationPreferences(
    @Req() { user }: Request,
    @Body() dto: UpdateNotificationsReqDto,
  ) {
    return this.userSettingsService.updateNotificationPreferences(
      user!.id,
      dto,
    );
  }
}
