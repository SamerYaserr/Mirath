import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

import { AppConfig } from 'src/config/configuration';
import { winstonLogger as logger } from 'src/config/logger.config';
import ChatSessionsRepository from './repositories/sessions.repository';

@Injectable()
export class ChatbotCleanupService {
  constructor(
    private readonly sessionsRepo: ChatSessionsRepository,
    private readonly httpService: HttpService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  @Cron(CronExpression.EVERY_HOUR)
  async cleanupExpiredTemporarySessions(): Promise<void> {
    let expired: Awaited<
      ReturnType<ChatSessionsRepository['findExpiredTemporary']>
    >;

    try {
      expired = await this.sessionsRepo.findExpiredTemporary();
    } catch (err: unknown) {
      logger.error('ChatbotCleanupService: failed to query expired sessions', {
        err,
      });
      return;
    }

    if (expired.length === 0) return;

    logger.info(
      `ChatbotCleanupService: found ${expired.length} expired temporary session(s) to clean up`,
    );

    for (const session of expired) {
      try {
        await firstValueFrom(
          this.httpService.delete(
            `${this.configService.get('EXTERNAL_API_BASE_URL')}/temporary/chat`,
            { data: { thread_id: session.id } },
          ),
        ).catch((aiErr: unknown) => {
          logger.error(
            `ChatbotCleanupService: AI-side DELETE failed for session ${session.id}`,
            { error: aiErr },
          );
        });

        await this.sessionsRepo.deleteOne(session.id);

        logger.info(
          `ChatbotCleanupService: deleted expired temporary session ${session.id} (userId: ${session.userId})`,
        );
      } catch (err: unknown) {
        logger.error(
          `ChatbotCleanupService: failed to clean up session ${session.id}`,
          { err },
        );
      }
    }
  }
}
