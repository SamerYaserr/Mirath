export const NOTIFICATION_EVENTS = {
  FOLLOW_CREATED: 'notifications.follow.created',
  READING_LIST_SAVED: 'notifications.readingList.saved',
  COMMENT_CREATED: 'notifications.comment.created',
  REPLY_CREATED: 'notifications.reply.created',
  MENTION_CREATED: 'notifications.mention.created',
  VOTE_DISCUSSION: 'notifications.vote.discussion',
  VOTE_COMMENT: 'notifications.vote.comment',
} as const;

export interface BaseNotificationPayload {
  targetUserId: string;
  actorUserId: string;
  actorName: string;
  actorPhotoUrl: string | null;
}

export interface FollowCreatedPayload extends BaseNotificationPayload {}

export interface ReadingListSavedPayload extends BaseNotificationPayload {
  listId: string;
  listTitle: string;
}

export interface CommentCreatedPayload extends BaseNotificationPayload {
  discussionId: string;
  commentId: string;
  contentPreview: string;
}

export interface ReplyCreatedPayload extends BaseNotificationPayload {
  discussionId: string;
  commentId: string;
  parentCommentId: string;
  contentPreview: string;
}

export interface MentionCreatedPayload {
  actorUserId: string;
  actorName: string;
  actorPhotoUrl: string | null;
  mentionedUsername: string;
  discussionId: string;
  commentId: string;
  contentPreview: string;
}

export interface VoteDiscussionPayload extends BaseNotificationPayload {
  discussionId: string;
  discussionTitle: string;
}

export interface VoteCommentPayload extends BaseNotificationPayload {
  discussionId: string;
  commentId: string;
  contentPreview: string;
}

export type NotificationPayload =
  | FollowCreatedPayload
  | ReadingListSavedPayload
  | CommentCreatedPayload
  | ReplyCreatedPayload
  | MentionCreatedPayload
  | VoteDiscussionPayload
  | VoteCommentPayload;
