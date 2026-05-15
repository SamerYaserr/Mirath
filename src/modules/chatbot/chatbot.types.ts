import { Subscriber } from 'rxjs';
import {
  AttachmentType,
  ChatMessage,
  FeedbackType,
  MessageRole,
  MessageType,
} from '@prisma/client';

import { SseEvent } from 'src/common/types/api.types';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateChatbotMessageReqDto } from './dto/requests/create-chatbot-message.req.dto';
import { Readable } from 'stream';

export type ChatbotMessageDataEvent =
  | { delta: string }
  | { error: string }
  | '[DONE]';

export type ChatbotAudioDataEvent =
  | { transcription: string }
  | ChatbotMessageDataEvent;

export type ProcessMessagePayload = CreateChatbotMessageReqDto & {
  userId: string;
  sessionId: string;
  file?: Express.Multer.File;
  abortController: AbortController;
  subscriber: Subscriber<SseEvent<ChatbotMessageDataEvent>>;
};

export type RenameChatSessionPayload = {
  sessionId: string;
  newTitle: string | undefined;
  userId: string;
};

export type FindMessagesPayload = {
  sessionId: string;
  userId: string;
} & Omit<PaginationDto, 'page'>;

export type FindManyParams = Pick<ChatMessage, 'sessionId'> &
  Omit<PaginationDto, 'page'>;

export type FindSessionsPayload = Omit<FindMessagesPayload, 'sessionId'>;

export type RenameChatSessionExternalApiPayload = {
  thread_id: string;
  new_title: string;
  user_id: string;
};

export type ExternalApiStreamResponse = {
  type: 'chunk' | 'error' | 'end' | 'metadata';
  content?:
    | string
    | [
        {
          type: 'text';
          text: string;
        },
      ];
  chat_title?: string;
};

export type HandleStreamEventsPayload = {
  stream: Readable;
  subscriber: Subscriber<SseEvent<ChatbotMessageDataEvent>>;
};

export type PersistStreamedMessageAndTitlePayload = {
  persisted: boolean;
  assembledResponse: string;
  sessionId: string;
  newTitle: string | undefined;
  isTemporary: boolean;
};

export type CreateMessageData = {
  sessionId: string;
  role: MessageRole;
  type: MessageType;
  content: string;
};

export type CreateAttachmentData = {
  type: AttachmentType;
  url: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds?: number | null;
};

export type ProcessImageMessagePayload = {
  userId: string;
  sessionId: string;
  file: Express.Multer.File;
  content: string;
  abortController: AbortController;
  subscriber: Subscriber<SseEvent<ChatbotMessageDataEvent>>;
};

export type CallExternalChatStreamParams = {
  userId: string;
  sessionId: string;
  content: string;
  file?: Express.Multer.File;
  abortController: AbortController;
};

export type CallExternalAudioStreamParams = {
  userId: string;
  sessionId: string;
  audioFile: Express.Multer.File;
  abortController: AbortController;
};

export type ProcessAudioMessagePayload = {
  userId: string;
  sessionId: string;
  audioFile: Express.Multer.File;
  durationSeconds: number;
  abortController: AbortController;
  subscriber: Subscriber<SseEvent<ChatbotAudioDataEvent>>;
};

export const EXT_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
};

export type SubmitFeedbackParams = {
  sessionId: string;
  messageId: string;
  userId: string;
  feedbackType: FeedbackType;
};
