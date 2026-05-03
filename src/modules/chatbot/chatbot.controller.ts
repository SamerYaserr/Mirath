import type { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Post, Query, Req } from '@nestjs/common';

import { ChatbotService } from './chatbot.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';

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

  @Get('sessions')
  findAll(@Req() req: Request, @Query() q: PaginationDto) {
    const userId = req.user!.id;
    const { page, limit } = q;
    return this.chatbotService.findAll(userId, page, limit);
  }
}
