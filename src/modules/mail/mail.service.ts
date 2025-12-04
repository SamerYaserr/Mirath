import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

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

  async sendOtpEmail(email: string, otp: string) {
    await this.mailerService.sendMail({
      to: email,
      subject: 'Verify your email address',
      template: 'otp',
      context: {
        otp: otp,
        year: new Date().getFullYear(),
      },
    });
  }
}
