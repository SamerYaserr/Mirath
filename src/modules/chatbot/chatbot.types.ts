import { PaginationDto } from 'src/common/dto/pagination.dto';
import { CreateChatbotMessageReqDto } from './dto/requests/create-chatbot-message.req.dto';
import { ChatMessage } from '@prisma/client';

export type CreateMessagePayload = CreateChatbotMessageReqDto & {
  userId: string;
  sessionId: string;
};

export type RenameChatSessionPayload = {
  thread_id: string;
  new_title: string;
  user_id: string;
};

export type FindMessagesPayload = {
  sessionId: string;
  userId: string;
} & Omit<PaginationDto, 'page'>;

export type FindManyParams = Pick<ChatMessage, 'sessionId'> &
  Omit<PaginationDto, 'page'>;
