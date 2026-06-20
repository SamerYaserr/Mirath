import * as bcrypt from 'bcrypt';
import { OtpPurpose, User } from '@prisma/client';
import {
  Injectable,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';

import { AuthService } from '../auth/auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { OtpRepository } from '../auth/repositories/otp.repository';
import { UsersRepository } from '../users/repositories/users.repository';
import { ConfirmEmailReqDto } from './dto/requests/confirm-email.req.dto';
import { ChangeUsernameReqDto } from './dto/requests/change-username.req.dto';
import { RequestEmailChangeReqDto } from './dto/requests/request-email-change.req.dto';
import { UserSettingsRepository } from './repositories/user-settings.repository';

@Injectable()
export class UserSettingsService {
  constructor(
    private prisma: PrismaService,
    private readonly authService: AuthService,
    private readonly otpRepository: OtpRepository,
    private readonly userRepository: UsersRepository,
    readonly userSettingsRepository: UserSettingsRepository,
  ) {}

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
}
