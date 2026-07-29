import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as firebaseAdmin from 'firebase-admin';

import { AppConfig } from '../../../config/configuration';

export const FIREBASE_MESSAGING = 'FIREBASE_MESSAGING';

@Module({
  providers: [
    {
      provide: FIREBASE_MESSAGING,
      useFactory: (configService: ConfigService<AppConfig, true>) => {
        const projectId = configService.get('FIREBASE_PROJECT_ID');
        const clientEmail = configService.get('FIREBASE_CLIENT_EMAIL');
        const privateKey = configService
          .get('FIREBASE_PRIVATE_KEY')
          .replace(/\\n/g, '\n');

        if (!firebaseAdmin.apps.length) {
          firebaseAdmin.initializeApp({
            credential: firebaseAdmin.credential.cert({
              projectId,
              clientEmail,
              privateKey,
            }),
          });
        }

        return firebaseAdmin.messaging();
      },
      inject: [ConfigService],
    },
  ],
  exports: [FIREBASE_MESSAGING],
})
export class FirebaseModule {}
