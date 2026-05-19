import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import ChatbotService from './chatbot.service';
import ChatbotController from './chatbot.controller';
import ChatSessionsRepository from './repositories/sessions.repository';
import ChatMessagesRepository from './repositories/messages.repository';
import ChatFilesRepository from './repositories/chat-files.repository';
import MessageFeedbacksRepository from './repositories/message-feedbacks.repository';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { ChatFilePipe } from '../../common/pipes/chat-file.pipe';
import { ChatbotCleanupService } from './chatbot.cleanup.service';

@Module({
  imports: [HttpModule, CloudinaryModule],
  controllers: [ChatbotController],
  providers: [
    ChatSessionsRepository,
    ChatMessagesRepository,
    ChatFilesRepository,
    MessageFeedbacksRepository,
    ChatbotService,
    ChatFilePipe,
    ChatbotCleanupService,
  ],
})
export default class ChatbotModule {}
