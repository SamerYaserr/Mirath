import { Inject, Injectable, Logger } from '@nestjs/common';
import * as firebaseAdmin from 'firebase-admin';

import { FIREBASE_MESSAGING } from './firebase/firebase.module';

@Injectable()
export class PushNotificationService {
  private readonly logger = new Logger(PushNotificationService.name);

  constructor(
    @Inject(FIREBASE_MESSAGING)
    private readonly messaging: firebaseAdmin.messaging.Messaging,
  ) {}

  async sendToTokens(
    tokens: string[],
    title: string,
    body: string,
    data?: Record<string, string>,
  ): Promise<firebaseAdmin.messaging.BatchResponse> {
    const message: firebaseAdmin.messaging.MulticastMessage = {
      tokens,
      notification: { title, body },
      ...(data && { data }),
    };

    try {
      const response = await this.messaging.sendEachForMulticast(message);

      if (response.failureCount > 0) {
        this.logger.warn(
          `FCM multicast: ${response.successCount} delivered, ${response.failureCount} failed out of ${tokens.length} tokens`,
        );
      }

      return response;
    } catch (error) {
      this.logger.warn(`FCM multicast send failed: ${error}`);

      return {
        responses: [],
        successCount: 0,
        failureCount: tokens.length,
      };
    }
  }
}
