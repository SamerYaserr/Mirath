import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

import { AppConfig } from '../../config/configuration';
import { FirebaseModule } from './firebase/firebase.module';
import { NotificationHandler } from './notification.handler';
import { DeviceTokensService } from './device-tokens.service';
import { NotificationProcessor } from './notification.processor';
import { PushNotificationService } from './push-notification.service';
import { DeviceTokensController } from './controllers/device-tokens.controller';
import { DeviceTokensRepository } from './repositories/device-tokens.repository';
import { NotificationsRepository } from './repositories/notifications.repository';

@Module({
  imports: [
    BullModule.forRootAsync({
      useFactory: (configService: ConfigService<AppConfig, true>) => ({
        connection: {
          host: configService.get('REDIS_HOST'),
          port: configService.get('REDIS_PORT'),
        },
      }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: 'notifications' }),
    FirebaseModule,
  ],
  providers: [
    PushNotificationService,
    NotificationHandler,
    DeviceTokensService,
    NotificationProcessor,
    NotificationsRepository,
    DeviceTokensRepository,
  ],
  controllers: [DeviceTokensController],
})
export class NotificationsModule {}
