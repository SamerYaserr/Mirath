import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { ConfigService } from '@nestjs/config';

import { AppConfig } from '../../config/configuration';
import { FirebaseModule } from './firebase/firebase.module';
import { PushNotificationService } from './push-notification.service';
import { NotificationHandler } from './notification.handler';
import { NotificationProcessor } from './notification.processor';
import { NotificationsRepository } from './repositories/notifications.repository';
import { DeviceTokensRepository } from './repositories/device-tokens.repository';

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
    NotificationProcessor,
    NotificationsRepository,
    DeviceTokensRepository,
  ],
})
export class NotificationsModule {}
