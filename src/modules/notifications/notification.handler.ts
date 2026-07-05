import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

import { NOTIFICATION_EVENTS } from './notification-events';
import type {
  FollowCreatedPayload,
  ReadingListSavedPayload,
  CommentCreatedPayload,
  ReplyCreatedPayload,
  MentionCreatedPayload,
  VoteDiscussionPayload,
  VoteCommentPayload,
} from './notification-events';

@Injectable()
export class NotificationHandler {
  private readonly logger = new Logger(NotificationHandler.name);

  constructor(
    @InjectQueue('notifications') private readonly notificationsQueue: Queue,
  ) {}

  private async enqueue<T>(
    event: string,
    payload: T,
    withRetry = false,
  ): Promise<void> {
    try {
      const opts = withRetry
        ? {
            attempts: 3,
            backoff: { type: 'exponential' as const, delay: 2000 },
          }
        : undefined;
      await this.notificationsQueue.add(event, payload, opts);
    } catch (error) {
      this.logger.error(`Failed to enqueue ${event}: ${error}`);
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.FOLLOW_CREATED)
  async handleFollowCreated(payload: FollowCreatedPayload): Promise<void> {
    await this.enqueue(NOTIFICATION_EVENTS.FOLLOW_CREATED, payload, true);
  }

  @OnEvent(NOTIFICATION_EVENTS.READING_LIST_SAVED)
  async handleReadingListSaved(
    payload: ReadingListSavedPayload,
  ): Promise<void> {
    await this.enqueue(NOTIFICATION_EVENTS.READING_LIST_SAVED, payload, true);
  }

  @OnEvent(NOTIFICATION_EVENTS.COMMENT_CREATED)
  async handleCommentCreated(payload: CommentCreatedPayload): Promise<void> {
    await this.enqueue(NOTIFICATION_EVENTS.COMMENT_CREATED, payload, true);
  }

  @OnEvent(NOTIFICATION_EVENTS.REPLY_CREATED)
  async handleReplyCreated(payload: ReplyCreatedPayload): Promise<void> {
    await this.enqueue(NOTIFICATION_EVENTS.REPLY_CREATED, payload, true);
  }

  @OnEvent(NOTIFICATION_EVENTS.MENTION_CREATED)
  async handleMentionCreated(payload: MentionCreatedPayload): Promise<void> {
    await this.enqueue(NOTIFICATION_EVENTS.MENTION_CREATED, payload, true);
  }

  @OnEvent(NOTIFICATION_EVENTS.VOTE_DISCUSSION)
  async handleVoteDiscussion(payload: VoteDiscussionPayload): Promise<void> {
    await this.enqueue(NOTIFICATION_EVENTS.VOTE_DISCUSSION, payload, true);
  }

  @OnEvent(NOTIFICATION_EVENTS.VOTE_COMMENT)
  async handleVoteComment(payload: VoteCommentPayload): Promise<void> {
    await this.enqueue(NOTIFICATION_EVENTS.VOTE_COMMENT, payload, true);
  }
}
