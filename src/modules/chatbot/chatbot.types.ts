import { Subscriber } from 'rxjs';
import {
  AttachmentType,
  ChatFile,
  ChatMessage,
  FeedbackType,
  MessageRole,
  MessageType,
} from '@prisma/client';

import { SseEvent } from 'src/common/types/api.types';
import { PaginationDto } from 'src/common/dto/pagination.dto';

export type ChatbotMessageDataEvent =
  | { delta: string }
  | { status: string }
  | { error: string }
  | '[DONE]';

export type ChatbotAudioDataEvent =
  | { transcription: string }
  | ChatbotMessageDataEvent;

export type ChatbotStreamDataEvent =
  | ChatbotMessageDataEvent
  | { transcription: string };

export type ExternalApiStreamResponse =
  | { type: 'chat_title'; content?: string }
  | { type: 'status'; content?: string }
  | { type: 'model_answer'; content?: string }
  | { type: 'end'; content?: string }
  | { type: 'error'; content?: string };

export type ResolvedChatFile = Pick<
  ChatFile,
  'id' | 'type' | 'url' | 'mimeType' | 'sizeBytes' | 'durationSeconds'
>;

export type ProcessStreamPayload = {
  userId: string;
  sessionId: string;
  content: string | undefined;
  fileId: string | undefined;
  abortController: AbortController;
  subscriber: Subscriber<SseEvent<ChatbotStreamDataEvent>>;
};

export type ProcessImageStreamPayload = {
  userId: string;
  sessionId: string;
  content: string;
  chatFile: ResolvedChatFile;
  abortController: AbortController;
  subscriber: Subscriber<SseEvent<ChatbotStreamDataEvent>>;
};

export type ProcessAudioStreamPayload = {
  userId: string;
  sessionId: string;
  chatFile: ResolvedChatFile;
  abortController: AbortController;
  subscriber: Subscriber<SseEvent<ChatbotStreamDataEvent>>;
};

export type PersistStreamedMessageAndTitlePayload = {
  persisted: boolean;
  assembledResponse: string;
  sessionId: string;
  newTitle: string | undefined;
  isTemporary: boolean;
};

export type FindMessagesPayload = {
  sessionId: string;
  userId: string;
} & Omit<PaginationDto, 'page'>;

export type FindManyParams = Pick<ChatMessage, 'sessionId'> &
  Omit<PaginationDto, 'page'>;

export type FindSessionsPayload = Omit<FindMessagesPayload, 'sessionId'>;

export type CreateMessageData = {
  sessionId: string;
  role: MessageRole;
  type?: MessageType;
  content: string;
};

export type CreateAttachmentData = {
  type: AttachmentType;
  url: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds?: number | null;
};

export type SubmitFeedbackParams = {
  sessionId: string;
  messageId: string;
  userId: string;
  feedbackType: FeedbackType;
};

export type RenameChatSessionPayload = {
  sessionId: string;
  newTitle: string | undefined;
  userId: string;
};

export type RenameChatSessionExternalApiPayload = {
  thread_id: string;
  new_title: string;
  user_id: string;
};

export type CallExternalChatStreamParams = {
  userId: string;
  sessionId: string;
  content: string;
  imageUrl?: string;
  imageMimeType?: string;
  audioUrl?: string;
  audioMimeType?: string;
  abortController: AbortController;
};

export const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};
