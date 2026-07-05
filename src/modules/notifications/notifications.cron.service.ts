import { Cron } from '@nestjs/schedule';
import { NotificationType } from '@prisma/client';
import { Injectable, Logger } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { PushNotificationService } from './push-notification.service';
import { DeviceTokensRepository } from './repositories/device-tokens.repository';
import { NotificationsRepository } from './repositories/notifications.repository';

@Injectable()
export class NotificationsCronService {
  private readonly logger = new Logger(NotificationsCronService.name);
  constructor(
    private readonly prisma: PrismaService,
    private readonly deviceTokensRepository: DeviceTokensRepository,
    private readonly notificationsRepository: NotificationsRepository,
    private readonly pushNotificationService: PushNotificationService,
  ) {}

  @Cron('0 8 * * 1', { name: 'weekly-research-digest' })
  async handleWeeklyDigest(): Promise<void> {
    this.logger.log('Weekly research digest cron job started');

    const users = await this.prisma.user.findMany({
      where: {
        settings: { notifyNewPapersInField: true },
        deviceFcmTokens: { some: {} },
      },
      select: {
        id: true,
        deviceFcmTokens: { select: { id: true, token: true } },
        userInterests: { select: { interest: { select: { name: true } } } },
      },
    });

    let totalSent = 0;
    let totalErrors = 0;
    const weekStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const allRecentPapers = await this.prisma.paper.findMany({
      where: {
        publishedAt: { gte: weekStart },
      },
    });

    for (const user of users) {
      try {
        const interestNames = user.userInterests.map((ui) => ui.interest.name);

        const papers = allRecentPapers.filter((paper) =>
          paper.categories.some((c) => interestNames.includes(c)),
        );

        if (papers.length === 0) continue;

        let topPaper = papers[0]!;
        let maxOverlap = -1;

        for (const paper of papers) {
          const overlap = paper.categories.filter((c) =>
            interestNames.includes(c),
          ).length;
          if (overlap > maxOverlap) {
            maxOverlap = overlap;
            topPaper = paper;
          }
        }

        await this.notificationsRepository.create({
          recipientId: user.id,
          type: NotificationType.WEEKLY_DIGEST,
          metadata: {
            paperCount: papers.length,
            topPaperId: topPaper.id,
            topPaperTitle: topPaper.title,
          },
        });

        const tokens = user.deviceFcmTokens.map((t) => t.token);
        const batchResponse = await this.pushNotificationService.sendToTokens(
          tokens,
          'Your Weekly Research Digest',
          `We found ${papers.length} new paper(s) matching your interests. Top match: "${topPaper.title}"`,
          {
            type: 'weekly_digest',
            count: String(papers.length),
            topPaperId: topPaper.id,
          },
        );

        for (const [index, result] of batchResponse.responses.entries()) {
          if (
            result.error?.code === 'messaging/registration-token-not-registered'
          ) {
            await this.deviceTokensRepository.deleteById(
              user.deviceFcmTokens[index]!.id,
            );
          }
        }

        totalSent++;
      } catch (error) {
        totalErrors++;
        this.logger.warn(
          `Failed to process weekly digest for user ${user.id}: ${error}`,
        );
      }
    }

    this.logger.log(
      `Weekly digest complete — targeted: ${users.length}, sent: ${totalSent}, errors: ${totalErrors}`,
    );
  }
}
