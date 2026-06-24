import * as bcrypt from 'bcrypt';
import { OtpPurpose, User } from '@prisma/client';
import {
  Injectable,
  ConflictException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';

import { UpdateDisplayReqDto } from './dto/requests/update-display.req.dto';
import { DisplaySettingsResDto } from './dto/responses/display-settings.res.dto';
import { AppearanceSettingsResDto } from './dto/responses/appearance-settings.res.dto';
import { UpdateReadingReqDto } from './dto/requests/update-reading.req.dto';
import { ReadingSettingsResDto } from './dto/responses/reading-settings.res.dto';
import { ConfirmEmailReqDto } from './dto/requests/confirm-email.req.dto';
import { UpdatePasswordReqDto } from './dto/requests/update-password.req.dto';
import { ChangeUsernameReqDto } from './dto/requests/change-username.req.dto';
import { AccountSessionResDto } from './dto/responses/account-session.res.dto';
import { RequestEmailChangeReqDto } from './dto/requests/request-email-change.req.dto';
import { FeedSettingsResDto } from './dto/responses/feed-settings.res.dto';
import { UpdateFeedPreferencesReqDto } from './dto/requests/update-feed.req.dto';
import { ReplaceInterestsReqDto } from './dto/requests/replace-interests.req.dto';
import { NotificationPreferencesResDto } from './dto/responses/notification-preferences.res.dto';
import { UpdateNotificationsReqDto } from './dto/requests/update-notifications.req.dto';
import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { HttpResponse } from 'src/common/types/api.types';
import { OtpRepository } from '../auth/repositories/otp.repository';
import { UsersRepository } from '../users/repositories/users.repository';
import { RefreshTokenRepository } from '../auth/repositories/refreshToken.repository';
import { UserSettingsRepository } from './repositories/user-settings.repository';
import { ReadingListsRepository } from '../reading-lists/repositories/reading-lists.repository';
import { HighlightsRepository } from '../paper-annotations/repositories/highlights.repository';
import { UpdatePrivacyReqDto } from './dto/requests/update-privacy.req.dto';
import { PrivacySettingsResDto } from './dto/responses/privacy-settings.res.dto';
import { ReadingListExportFormat } from './enums/reading-list-export-format.enum';
import { AnnotationsExportFormat } from './enums/annotation-export-format.enum';

@Injectable()
export class UserSettingsService {
  constructor(
    private prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly otpRepository: OtpRepository,
    private readonly userRepository: UsersRepository,
    private readonly userSettingsRepository: UserSettingsRepository,
    private readonly refreshTokenRepository: RefreshTokenRepository,
    private readonly readingListsRepository: ReadingListsRepository,
    private readonly highlightsRepository: HighlightsRepository,
  ) {}

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

  async updateUsername(
    dto: ChangeUsernameReqDto,
    { id: userId, username }: User,
  ) {
    if (dto.newUsername === username) {
      throw new ConflictException(
        'New username is the same as the current username',
      );
    }

    const user = await this.userRepository.findByEmailOrUsername({
      email: '',
      username: dto.newUsername,
      where: { id: { not: userId } },
      select: { id: true },
    });

    if (user) {
      throw new ConflictException('Username is already taken');
    }

    await this.userRepository.update({
      where: { id: userId },
      data: { username: dto.newUsername },
    });

    return { message: 'Username updated successfully' };
  }

  async requestEmailChange(
    dto: RequestEmailChangeReqDto,
    { id: userId, email }: User,
  ) {
    if (dto.newEmail === email) {
      throw new ConflictException('New email is the same as the current email');
    }

    const user = await this.userRepository.findByEmail({
      email: dto.newEmail,
      where: { id: { not: userId } },
    });

    if (user) {
      throw new ConflictException('Email is already taken');
    }

    await this.otpRepository.invalidatePendingOtps(
      userId,
      OtpPurpose.EMAIL_CHANGE,
    );
    await this.authService.generateAndSendOtp(
      userId,
      dto.newEmail,
      OtpPurpose.EMAIL_CHANGE,
    );

    return {
      message: 'A verification code has been sent to your new email address',
    };
  }

  async confirmEmailChange(
    { newEmail, otp: newOtp }: ConfirmEmailReqDto,
    { id: userId }: User,
  ) {
    const pendingOtp = await this.otpRepository.findPendingOtp(
      userId,
      OtpPurpose.EMAIL_CHANGE,
    );
    if (!pendingOtp) throw new BadRequestException('Invalid or expired OTP');

    const isMatch = await bcrypt.compare(newOtp, pendingOtp.otpCode);
    if (!isMatch || pendingOtp.newEmail !== newEmail) {
      throw new BadRequestException('Invalid or expired OTP');
    }

    // Atomic writes ... need a transaction
    await this.prisma.$transaction(async (tx) => {
      await this.otpRepository.markAsUsed(pendingOtp.id, tx);
      await this.userRepository.update(
        { where: { id: userId }, data: { email: newEmail } },
        tx,
      );
    });

    return { message: 'Email updated successfully' };
  }

  async updatePassword(
    { currentPassword, newPassword }: UpdatePasswordReqDto,
    { id: userId }: User,
  ) {
    const user = await this.userRepository.findById(userId, {
      password: true,
    });

    if (!user!.password) {
      throw new BadRequestException(
        'This account uses Google sign-in and has no password to update.',
      );
    }

    const isMatch = await bcrypt.compare(currentPassword, user!.password);
    if (!isMatch) {
      throw new ForbiddenException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.prisma.$transaction(async (tx) => {
      await this.userRepository.updatePassword({
        id: userId,
        password: hashedPassword,
        tx,
      });
      await this.refreshTokenRepository.deleteByUserId(userId, tx);
    });

    return {
      message:
        'Password updated successfully. You have been logged out of all other devices.',
    };
  }

  async unlinkGoogle({ id: userId }: User) {
    const user = await this.userRepository.findById(userId, {
      password: true,
    });

    if (!user!.password) {
      throw new BadRequestException(
        'Set a password first to avoid being locked out of your account.',
      );
    }

    await this.userRepository.update({
      where: { id: userId },
      data: { providerId: null },
    });

    return { message: 'Google account unlinked successfully' };
  }

  async getSessions(
    userId: string,
    sessionId: string,
  ): Promise<HttpResponse<AccountSessionResDto[]>> {
    const tokens = await this.refreshTokenRepository.findAllByUserId(userId);
    return {
      size: tokens.length,
      data: tokens.map((token) =>
        AccountSessionResDto.fromEntity(token, token.sessionId === sessionId),
      ),
    };
  }

  async revokeAllSessions(userId: string, sessionId: string) {
    await this.refreshTokenRepository.deleteAllExcept(userId, sessionId);
    return { message: 'Successfully logged out from all other devices' };
  }

  async getFeedSettings(
    userId: string,
  ): Promise<HttpResponse<FeedSettingsResDto>> {
    const userSettings = await this.userSettingsRepository.findByUserId(userId);
    return { data: FeedSettingsResDto.fromEntity(userSettings) };
  }

  async updateFeedSettings(
    userId: string,
    dto: UpdateFeedPreferencesReqDto,
  ): Promise<HttpResponse<FeedSettingsResDto>> {
    const updatedSettings = await this.userSettingsRepository.upsert(
      userId,
      dto,
    );
    return { data: FeedSettingsResDto.fromEntity(updatedSettings) };
  }

  async getResearchInterests(
    userId: string,
  ): Promise<HttpResponse<{ id: string; name: string }[]>> {
    const userSettings =
      await this.userSettingsRepository.findSettingsWithInterests(userId);
    const interests =
      userSettings?.recommendationInterests.map((ri) => ri.interest) || [];

    return {
      message: 'Research interests retrieved successfully',
      data: interests,
    };
  }

  async replaceResearchInterests(
    userId: string,
    dto: ReplaceInterestsReqDto,
  ): Promise<HttpResponse> {
    const updatedSettings = await this.userSettingsRepository.replaceInterests(
      userId,
      dto.interests,
    );

    return {
      message: 'Research interests updated successfully',
      data:
        updatedSettings?.recommendationInterests.map((ri) => ri.interest) || [],
    };
  }

  async getNotificationPreferences(
    userId: string,
  ): Promise<HttpResponse<NotificationPreferencesResDto>> {
    const userSettings = await this.userSettingsRepository.findByUserId(userId);
    return {
      message: 'Notification preferences retrieved successfully',
      data: NotificationPreferencesResDto.fromEntity(userSettings),
    };
  }

  async updateNotificationPreferences(
    userId: string,
    dto: UpdateNotificationsReqDto,
  ): Promise<HttpResponse<NotificationPreferencesResDto>> {
    const updatedSettings = await this.userSettingsRepository.upsert(
      userId,
      dto.toUpsert(),
    );
    return {
      message: 'Notification preferences updated successfully',
      data: NotificationPreferencesResDto.fromEntity(updatedSettings),
    };
  }

  async getPrivacySettings(userId: string): Promise<HttpResponse<PrivacySettingsResDto>> {
    const userSettings = await this.userSettingsRepository.findByUserId(userId);
    
    return {
      message: 'Privacy settings retrieved successfully',
      data: PrivacySettingsResDto.fromEntity(userSettings),
    };
  }

  async updatePrivacySettings(userId: string, dto: UpdatePrivacyReqDto): Promise<HttpResponse<PrivacySettingsResDto>> {
    const updateData: Partial<UpdatePrivacyReqDto> = { ...dto };
    
    if (updateData.isPrivateAccount === true) {
      updateData.allowProfileSearch = false;
    }
    
    const updatedSettings = await this.userSettingsRepository.upsert(userId, updateData);
    
    return {
      message: 'Privacy settings updated successfully',
      data: PrivacySettingsResDto.fromEntity(updatedSettings),
    };
  }

  async requestDataExport(userId: string): Promise<HttpResponse<null>> {
    return {
      message: 'Your data export has been requested. You will be notified by email when it is ready.',
    };
  }

  async exportReadingLists(
    userId: string,
    format: ReadingListExportFormat,
  ): Promise<HttpResponse> {
    const readingLists = await this.readingListsRepository.findAllByUserId(userId);

    // TODO: implement export logic based on format
    
    return {
      message: 'Reading lists exported successfully',
      data: readingLists,
      size: readingLists.length,
    };
  }

  async exportAnnotations(
    userId: string,
    format: AnnotationsExportFormat,
  ): Promise<HttpResponse> {
    const annotations = await this.highlightsRepository.findAllByUser(userId);
    
    // TODO: implement export logic based on format
    
    return {
      message: 'Annotations exported successfully',
      data: annotations,
      size: annotations.length,
    };  
  }
}
