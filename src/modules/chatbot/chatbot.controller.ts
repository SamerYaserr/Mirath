import type { Request } from 'express';
import { Controller, Post, Req } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { ChatbotService } from './chatbot.service';

@ApiTags('Chatbot')
@ApiBearerAuth()
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('sessions')
  create(@Req() req: Request) {
    const userId = req.user!.id;
    return this.chatbotService.create(userId);
  }
}
