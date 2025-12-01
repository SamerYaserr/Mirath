import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';

@Injectable()
export class MailService {
  constructor(private mailerService: MailerService) {}

  async sendWelcome(user: { email: string; name?: string }) {
    await this.mailerService.sendMail({
      to: user.email,
      subject: 'Welcome to Mirath! 🎉',
      template: 'welcome',
      context: {
        name: user.name || null,
        year: new Date().getFullYear(),
      },
    });
  }
}
