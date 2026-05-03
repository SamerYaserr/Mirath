import type { Request } from 'express';
import { Body, Controller, Param, Post, Req } from '@nestjs/common';

import { IdDto } from 'src/common/dto/id.dto';
import ChatbotService from './chatbot.service';
import { CreateChatbotMessageReqDto } from './dto/requests/create-chatbot-message.req.dto';

@Controller('chatbot')
export default class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('sessions/:id/messages')
  create(
    @Req() req: Request,
    @Param() IdDto: IdDto,
    @Body() dto: CreateChatbotMessageReqDto,
  ) {
    return this.chatbotService.createMessage({
      sessionId: IdDto.id,
      userId: req.user!.id,
      ...dto,
    });
  }
}
