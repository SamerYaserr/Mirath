import type { Request } from 'express';
import { Body, Controller, Get, Param, Post, Req } from '@nestjs/common';

import { IdDto } from 'src/common/dto/id.dto';
import ChatbotService from './chatbot.service';
import { CreateChatbotMessageReqDto } from './dto/requests/create-chatbot-message.req.dto';
import { ChatbotMessageResDto } from './dto/responses/chatbot-message.res.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { HttpResponse } from 'src/common/types/api.types';

@Controller('chatbot')
export default class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Post('sessions/:id/messages')
  createMessage(
    @Req() req: Request,
    @Param() { id }: IdDto,
    @Body() dto: CreateChatbotMessageReqDto,
  ) {
    return this.chatbotService.createMessage({
      sessionId: id,
      userId: req.user!.id,
      ...dto,
    });
  }

  @Get('sessions/:id/messages')
  findMessages(
    @Req() req: Request,
    @Param() { id }: IdDto,
    @Body() dto: PaginationDto,
  ): Promise<HttpResponse<ChatbotMessageResDto[]>> {
    return this.chatbotService.findMessages({
      sessionId: id,
      skip: dto.skip,
      limit: dto.limit,
      userId: req.user!.id,
    });
  }
}
