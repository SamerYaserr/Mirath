import { CreateChatbotMessageReqDto } from './dto/requests/create-chatbot-message.req.dto';

export type CreateMessagePayload = CreateChatbotMessageReqDto & {
  userId: string;
  sessionId: string;
};

export type RenameChatSessionPayload = {
  thread_id: string;
  new_title: string;
  user_id: string;
};
