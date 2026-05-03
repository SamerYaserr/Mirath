import type { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { Controller, Get, Param, Post, Query, Req } from '@nestjs/common';

import { ChatbotService } from './chatbot.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { IdDto } from 'src/common/dto/id.dto';

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

  @Get('sessions/:id')
  findOne(@Req() req: Request, @Param() { id }: IdDto) {
    const userId = req.user!.id;
    return this.chatbotService.findOne(id, userId);
  }
}
