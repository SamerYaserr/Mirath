import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import ChatbotService from './chatbot.service';
import ChatbotController from './chatbot.controller';
import ChatSessionsRepository from './repositories/sessions.repository';
import ChatMessagesRepository from './repositories/messages.repository';

@Module({
  imports: [HttpModule],
  controllers: [ChatbotController],
  providers: [ChatSessionsRepository, ChatMessagesRepository, ChatbotService],
})
export default class ChatbotModule {}
