import { OtpPurpose } from '@prisma/client';
import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';

const OTP_SUBJECTS: Record<OtpPurpose, string> = {
  [OtpPurpose.REGISTER]: 'Verify your email address',
  [OtpPurpose.RESET_PASSWORD]: 'Reset your password',
  [OtpPurpose.EMAIL_CHANGE]: 'Confirm your new email address',
};

const OTP_HEADINGS: Record<OtpPurpose, string> = {
  [OtpPurpose.REGISTER]: 'Verify Your Email',
  [OtpPurpose.RESET_PASSWORD]: 'Reset Your Password',
  [OtpPurpose.EMAIL_CHANGE]: 'Confirm Your New Email',
};

const OTP_INTROS: Record<OtpPurpose, string> = {
  [OtpPurpose.REGISTER]:
    'Hi there, please use the verification code below to complete your registration.',
  [OtpPurpose.RESET_PASSWORD]:
    'Hi there, please use the verification code below to reset your password.',
  [OtpPurpose.EMAIL_CHANGE]:
    'Hi there, please use the verification code below to confirm your new email address.',
};

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendWelcome(user: { email: string; username?: string }) {
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Welcome to Mirath! 🎉',
      template: 'welcome',
      context: {
        username: user.username || null,
        year: new Date().getFullYear(),
      },
    });
  }

  async sendOtpEmail(email: string, otp: string, purpose: OtpPurpose) {
    await this.mailerService.sendMail({
      to: email,
      subject: OTP_SUBJECTS[purpose],
      template: 'otp',
      context: {
        otp,
        year: new Date().getFullYear(),
        heading: OTP_HEADINGS[purpose],
        intro: OTP_INTROS[purpose],
      },
    });
  }

  async sendDeletionWarning(
    user: { email: string; username?: string },
    scheduledDeletionAt: Date,
  ) {
    const deletionDate = scheduledDeletionAt.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Your account is scheduled for deletion',
      template: 'deletion-warning',
      context: {
        username: user.username || null,
        deletionDate,
        year: new Date().getFullYear(),
      },
    });
  }
}
