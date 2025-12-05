import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { UserRepository } from './repositories/user.repository';
import { OtpRepository } from './repositories/otp.repository';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MailService } from '../mail/mail.service';
import { TokenService } from './utils/token.service';
import { RefreshTokenRepository } from './repositories/refreshToken.repository';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        secret: config.get<string>('JWT_ACCESS_SECRET') || '',
        signOptions: {
          expiresIn: `${config.get<number>('JWT_ACCESS_EXPIRATION_MINUTES') || 60}m`,
        },
      }),
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    UserRepository,
    OtpRepository,
    RefreshTokenRepository,
    MailService,
    TokenService,
  ],
  exports: [AuthService],
})
export class AuthModule {}
