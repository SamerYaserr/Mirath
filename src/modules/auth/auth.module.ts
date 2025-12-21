import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { OtpRepository } from './repositories/otp.repository';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { MailService } from '../mail/mail.service';
import { TokenService } from './utils/token.service';
import { RefreshTokenRepository } from './repositories/refreshToken.repository';
import { ConfigService } from '@nestjs/config';
import { UsersModule } from '../users/users.module';

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
    UsersModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpRepository,
    RefreshTokenRepository,
    MailService,
    TokenService,
  ],
  exports: [AuthService, TokenService],
})
export class AuthModule {}
