import { Subscriber } from 'rxjs';
import { ChatMessage } from '@prisma/client';

import { SseEvent } from 'src/common/types/api.types';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateChatbotMessageReqDto } from './dto/requests/create-chatbot-message.req.dto';
import { Readable } from 'stream';

export type ChatbotMessageDataEvent =
  | {
      delta: string;
    }
  | { error: string }
  | '[DONE]';

export type ProcessMessagePayload = CreateChatbotMessageReqDto & {
  userId: string;
  sessionId: string;
  abortController: AbortController;
  subscriber: Subscriber<SseEvent<ChatbotMessageDataEvent>>;
};

export type RenameChatSessionPayload = {
  sessionId: string;
  newTitle: string;
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
  content?: string;
  chat_title?: string;
};

export type HandleStreamEventsPayload = {
  stream: Readable;
  subscriber: Subscriber<SseEvent<ChatbotMessageDataEvent>>;
};

export type PersistStreamedMessagePayload = {
  persisted: boolean;
  assembledResponse: string;
  sessionId: string;
};
