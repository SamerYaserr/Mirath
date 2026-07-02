import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { NotificationType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { PushNotificationService } from './push-notification.service';
import { NotificationsRepository } from './repositories/notifications.repository';
import { DeviceTokensRepository } from './repositories/device-tokens.repository';
import {
  NOTIFICATION_EVENTS,
  FollowCreatedPayload,
  ReadingListSavedPayload,
  CommentCreatedPayload,
  ReplyCreatedPayload,
  MentionCreatedPayload,
  VoteDiscussionPayload,
  VoteCommentPayload,
} from './notification-events';

@Processor('notifications')
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly pushService: PushNotificationService,
    private readonly notificationsRepo: NotificationsRepository,
    private readonly deviceTokensRepo: DeviceTokensRepository,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case NOTIFICATION_EVENTS.FOLLOW_CREATED:
        return this.handleFollow(job as Job<FollowCreatedPayload>);
      case NOTIFICATION_EVENTS.READING_LIST_SAVED:
        return this.handleReadingListSaved(job as Job<ReadingListSavedPayload>);
      case NOTIFICATION_EVENTS.COMMENT_CREATED:
        return this.handleComment(job as Job<CommentCreatedPayload>);
      case NOTIFICATION_EVENTS.REPLY_CREATED:
        return this.handleReply(job as Job<ReplyCreatedPayload>);
      case NOTIFICATION_EVENTS.MENTION_CREATED:
        return this.handleMention(job as Job<MentionCreatedPayload>);
      case NOTIFICATION_EVENTS.VOTE_DISCUSSION:
        return this.handleVoteDiscussion(job as Job<VoteDiscussionPayload>);
      case NOTIFICATION_EVENTS.VOTE_COMMENT:
        return this.handleVoteComment(job as Job<VoteCommentPayload>);
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }
  }

  private async handleFollow(job: Job<FollowCreatedPayload>): Promise<void> {
    const { targetUserId, actorUserId, actorName, actorPhotoUrl } = job.data;

    if (!(await this.isPreferenceEnabled(targetUserId, 'notifyNewFollowers'))) {
      return;
    }

    await this.notificationsRepo.create({
      recipientId: targetUserId,
      actorId: actorUserId,
      type: NotificationType.FOLLOW,
      metadata: { actorName, actorPhotoUrl },
      jobId: job.id,
    });

    await this.sendPush(
      targetUserId,
      `New Follower`,
      `${actorName} started following you`,
      {
        type: NotificationType.FOLLOW,
        actorUserId,
      },
    );
  }

  private async handleReadingListSaved(
    job: Job<ReadingListSavedPayload>,
  ): Promise<void> {
    const {
      targetUserId,
      actorUserId,
      actorName,
      actorPhotoUrl,
      listId,
      listTitle,
    } = job.data;

    if (
      !(await this.isPreferenceEnabled(
        targetUserId,
        'notifyReadingListActivity',
      ))
    ) {
      return;
    }

    await this.notificationsRepo.create({
      recipientId: targetUserId,
      actorId: actorUserId,
      type: NotificationType.READING_LIST_SAVED,
      metadata: { actorName, actorPhotoUrl, listId, listTitle },
      jobId: job.id,
    });

    await this.sendPush(
      targetUserId,
      `${actorName} saved your reading list`,
      listTitle,
      { type: NotificationType.READING_LIST_SAVED, listId },
    );
  }

  private async handleComment(job: Job<CommentCreatedPayload>): Promise<void> {
    const {
      targetUserId,
      actorUserId,
      actorName,
      actorPhotoUrl,
      discussionId,
      commentId,
      contentPreview,
    } = job.data;

    if (
      !(await this.isPreferenceEnabled(targetUserId, 'notifyDiscussionReplies'))
    ) {
      return;
    }

    await this.notificationsRepo.create({
      recipientId: targetUserId,
      actorId: actorUserId,
      type: NotificationType.COMMENT,
      metadata: {
        actorName,
        actorPhotoUrl,
        discussionId,
        commentId,
        contentPreview,
      },
      jobId: job.id,
    });

    await this.sendPush(
      targetUserId,
      'New Comment',
      `${actorName} commented on your discussion.`,
      {
        type: 'comment',
        discussionId,
        commentId,
        contentPreview,
      },
    );
  }

  private async handleReply(job: Job<ReplyCreatedPayload>): Promise<void> {
    const {
      targetUserId,
      actorUserId,
      actorName,
      actorPhotoUrl,
      discussionId,
      commentId,
      parentCommentId,
      contentPreview,
    } = job.data;

    if (
      !(await this.isPreferenceEnabled(targetUserId, 'notifyDiscussionReplies'))
    ) {
      return;
    }

    await this.notificationsRepo.create({
      recipientId: targetUserId,
      actorId: actorUserId,
      type: NotificationType.REPLY,
      metadata: {
        actorName,
        actorPhotoUrl,
        discussionId,
        commentId,
        parentCommentId,
        contentPreview,
      },
      jobId: job.id,
    });

    await this.sendPush(
      targetUserId,
      'New Reply',
      `${actorName} replied to your comment.`,
      {
        type: 'reply',
        discussionId,
        commentId,
        parentCommentId,
        contentPreview,
      },
    );
  }

  private async handleMention(job: Job<MentionCreatedPayload>): Promise<void> {
    const {
      actorUserId,
      actorName,
      actorPhotoUrl,
      discussionId,
      commentId,
      contentPreview,
      mentionedUsername,
    } = job.data;

    const resolvedUser = await this.prisma.user.findUnique({
      where: { username: mentionedUsername },
      select: { id: true },
    });

    if (!resolvedUser) {
      this.logger.debug(
        `Mentioned username "${mentionedUsername}" not found, skipping`,
      );
      return;
    }

    const resolvedUserId = resolvedUser.id;

    if (resolvedUserId === actorUserId) {
      return; // self-mention
    }

    if (
      !(await this.isPreferenceEnabled(resolvedUserId, 'notifyCommentMentions'))
    ) {
      return;
    }

    await this.notificationsRepo.create({
      recipientId: resolvedUserId,
      actorId: actorUserId,
      type: NotificationType.MENTION,
      metadata: {
        actorName,
        actorPhotoUrl,
        discussionId,
        commentId,
        contentPreview,
      },
      jobId: job.id,
    });

    await this.sendPush(
      resolvedUserId,
      'You Were Mentioned',
      `${actorName} mentioned you in a comment.`,
      {
        type: 'mention',
        discussionId,
        commentId,
        contentPreview,
      },
    );
  }

  private async handleVoteDiscussion(
    job: Job<VoteDiscussionPayload>,
  ): Promise<void> {
    const {
      targetUserId,
      actorUserId,
      actorName,
      actorPhotoUrl,
      discussionId,
      discussionTitle,
    } = job.data;

    if (
      !(await this.isPreferenceEnabled(targetUserId, 'notifyVotesOnContent'))
    ) {
      return;
    }

    await this.notificationsRepo.create({
      recipientId: targetUserId,
      actorId: actorUserId,
      type: NotificationType.VOTE_DISCUSSION,
      metadata: { actorName, actorPhotoUrl, discussionId, discussionTitle },
      jobId: job.id,
    });

    await this.sendPush(
      targetUserId,
      `${actorName} upvoted your discussion`,
      discussionTitle,
      { type: NotificationType.VOTE_DISCUSSION, discussionId },
    );
  }

  private async handleVoteComment(job: Job<VoteCommentPayload>): Promise<void> {
    const {
      targetUserId,
      actorUserId,
      actorName,
      actorPhotoUrl,
      discussionId,
      commentId,
      contentPreview,
    } = job.data;

    if (
      !(await this.isPreferenceEnabled(targetUserId, 'notifyVotesOnContent'))
    ) {
      return;
    }

    await this.notificationsRepo.create({
      recipientId: targetUserId,
      actorId: actorUserId,
      type: NotificationType.VOTE_COMMENT,
      metadata: {
        actorName,
        actorPhotoUrl,
        discussionId,
        commentId,
        contentPreview,
      },
      jobId: job.id,
    });

    await this.sendPush(
      targetUserId,
      `${actorName} upvoted your comment`,
      contentPreview,
      { type: NotificationType.VOTE_COMMENT, discussionId, commentId },
    );
  }

  private static readonly PREFERENCE_SELECT = {
    notifyNewFollowers: true,
    notifyReadingListActivity: true,
    notifyDiscussionReplies: true,
    notifyCommentMentions: true,
    notifyVotesOnContent: true,
  } as const;

  private async isPreferenceEnabled(
    userId: string,
    flag: keyof typeof NotificationProcessor.PREFERENCE_SELECT,
  ): Promise<boolean> {
    const settings = await this.prisma.userSettings.findUnique({
      where: { userId },
      select: { [flag]: true },
    });

    if (!settings) return true;

    return (settings as Record<string, unknown>)[flag] !== false;
  }

  private async sendPush(
    userId: string,
    title: string,
    body: string,
    data: Record<string, string>,
  ): Promise<void> {
    const deviceTokens = await this.deviceTokensRepo.findAllByUserId(userId);

    if (deviceTokens.length === 0) {
      this.logger.debug(`No device tokens for user ${userId}, skipping push`);
      return;
    }

    const tokens = deviceTokens.map((dt) => dt.token);
    const batchResponse = await this.pushService.sendToTokens(
      tokens,
      title,
      body,
      data,
    );

    let cleanedUp = 0;
    for (let i = 0; i < batchResponse.responses.length; i++) {
      const result = batchResponse.responses[i];
      const deviceToken = deviceTokens[i];
      if (
        result?.error &&
        result.error.code === 'messaging/registration-token-not-registered' &&
        deviceToken
      ) {
        await this.deviceTokensRepo.deleteById(deviceToken.id);
        cleanedUp++;
      }
    }

    this.logger.debug(
      `Push result for user ${userId}: ${tokens.length} targeted, ` +
        `${batchResponse.successCount} delivered, ${cleanedUp} cleaned up`,
    );
  }
}
