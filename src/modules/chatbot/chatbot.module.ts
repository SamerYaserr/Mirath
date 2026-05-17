import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import ChatbotService from './chatbot.service';
import ChatbotController from './chatbot.controller';
import ChatSessionsRepository from './repositories/sessions.repository';
import ChatMessagesRepository from './repositories/messages.repository';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { ChatImagePipe } from '../../common/pipes/chat-image.pipe';
import MessageFeedbacksRepository from './repositories/message-feedbacks.repository';
import { ChatbotCleanupService } from './chatbot.cleanup.service';
import { ChatAudioPipe } from 'src/common/pipes/chat-audio.pipe';

@Module({
  imports: [HttpModule, CloudinaryModule],
  controllers: [ChatbotController],
  providers: [
    ChatSessionsRepository,
    ChatMessagesRepository,
    MessageFeedbacksRepository,
    ChatbotService,
    ChatImagePipe,
    ChatAudioPipe,
    ChatbotCleanupService,
  ],
})
export default class ChatbotModule {}
