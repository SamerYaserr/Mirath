import { Module } from '@nestjs/common';

import { ChatbotService } from './chatbot.service';
import { ChatbotController } from './chatbot.controller';
import { ChatSessionsRepository } from './repositories/chat-sessions.repository';

@Module({
  controllers: [ChatbotController],
  providers: [ChatbotService, ChatSessionsRepository],
})
export class ChatbotModule {}
