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

  @OnEvent(NOTIFICATION_EVENTS.FOLLOW_CREATED)
  async handleFollowCreated(payload: FollowCreatedPayload): Promise<void> {
    try {
      await this.notificationsQueue.add(
        NOTIFICATION_EVENTS.FOLLOW_CREATED,
        payload,
      );
    } catch (error) {
      this.logger.error(
        `Failed to enqueue ${NOTIFICATION_EVENTS.FOLLOW_CREATED}: ${error}`,
      );
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.READING_LIST_SAVED)
  async handleReadingListSaved(
    payload: ReadingListSavedPayload,
  ): Promise<void> {
    try {
      await this.notificationsQueue.add(
        NOTIFICATION_EVENTS.READING_LIST_SAVED,
        payload,
      );
    } catch (error) {
      this.logger.error(
        `Failed to enqueue ${NOTIFICATION_EVENTS.READING_LIST_SAVED}: ${error}`,
      );
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.COMMENT_CREATED)
  async handleCommentCreated(payload: CommentCreatedPayload): Promise<void> {
    try {
      await this.notificationsQueue.add(
        NOTIFICATION_EVENTS.COMMENT_CREATED,
        payload,
      );
    } catch (error) {
      this.logger.error(
        `Failed to enqueue ${NOTIFICATION_EVENTS.COMMENT_CREATED}: ${error}`,
      );
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.REPLY_CREATED)
  async handleReplyCreated(payload: ReplyCreatedPayload): Promise<void> {
    try {
      await this.notificationsQueue.add(
        NOTIFICATION_EVENTS.REPLY_CREATED,
        payload,
      );
    } catch (error) {
      this.logger.error(
        `Failed to enqueue ${NOTIFICATION_EVENTS.REPLY_CREATED}: ${error}`,
      );
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.MENTION_CREATED)
  async handleMentionCreated(payload: MentionCreatedPayload): Promise<void> {
    try {
      await this.notificationsQueue.add(
        NOTIFICATION_EVENTS.MENTION_CREATED,
        payload,
      );
    } catch (error) {
      this.logger.error(
        `Failed to enqueue ${NOTIFICATION_EVENTS.MENTION_CREATED}: ${error}`,
      );
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.VOTE_DISCUSSION)
  async handleVoteDiscussion(payload: VoteDiscussionPayload): Promise<void> {
    try {
      await this.notificationsQueue.add(
        NOTIFICATION_EVENTS.VOTE_DISCUSSION,
        payload,
      );
    } catch (error) {
      this.logger.error(
        `Failed to enqueue ${NOTIFICATION_EVENTS.VOTE_DISCUSSION}: ${error}`,
      );
    }
  }

  @OnEvent(NOTIFICATION_EVENTS.VOTE_COMMENT)
  async handleVoteComment(payload: VoteCommentPayload): Promise<void> {
    try {
      await this.notificationsQueue.add(
        NOTIFICATION_EVENTS.VOTE_COMMENT,
        payload,
      );
    } catch (error) {
      this.logger.error(
        `Failed to enqueue ${NOTIFICATION_EVENTS.VOTE_COMMENT}: ${error}`,
      );
    }
  }
}
