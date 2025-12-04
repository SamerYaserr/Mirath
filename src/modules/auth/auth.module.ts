import { Module } from '@nestjs/common';

import { UserRepository } from './repositories/user.repository';
import { OtpRepository } from './repositories/otp.repository';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MailService } from '../mail/mail.service';

@Module({
  imports: [],
  controllers: [AuthController],
  providers: [AuthService, UserRepository, OtpRepository, MailService],
  exports: [AuthService],
})
export class AuthModule {}
