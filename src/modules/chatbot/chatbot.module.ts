import { Module } from '@nestjs/common';

import { ChatbotService } from './chatbot.service';
import { PrismaModule } from '../prisma/prisma.module';
import { ChatbotController } from './chatbot.controller';
import { CloudinaryModule } from '../cloudinary/cloudinary.module';
import { ChatSessionsRepository } from './repositories/chat-sessions.repository';

@Module({
  controllers: [ChatbotController],
  imports: [PrismaModule, CloudinaryModule],
  providers: [ChatbotService, ChatSessionsRepository],
})
export class ChatbotModule {}
