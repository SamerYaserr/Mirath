import type { Request } from 'express';
import {
  Req,
  Get,
  Body,
  Post,
  Query,
  Param,
  Controller,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
  getSchemaPath,
  ApiExtraModels,
} from '@nestjs/swagger';

import { IdDto } from 'src/common/dto/id.dto';
import ChatbotService from './chatbot.service';
import { HttpResponse } from 'src/common/types/api.types';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { ChatbotMessageResDto } from './dto/responses/chatbot-message.res.dto';
import { CreateChatbotMessageReqDto } from './dto/requests/create-chatbot-message.req.dto';

@ApiTags('Chatbot')
@ApiBearerAuth()
@ApiExtraModels(ChatbotMessageResDto)
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
  @ApiOperation({
    summary: 'List chatbot messages',
    description:
      'Returns the messages for a chat session in chronological order.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Chat messages retrieved successfully.',
    schema: {
      properties: {
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(ChatbotMessageResDto) },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Chat session not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'You do not have access to this chat session',
  })
  findMessages(
    @Req() req: Request,
    @Param() { id }: IdDto,
    @Query() dto: PaginationDto,
  ): Promise<HttpResponse<ChatbotMessageResDto[]>> {
    return this.chatbotService.findMessages({
      sessionId: id,
      skip: dto.skip,
      limit: dto.limit,
      userId: req.user!.id,
    });
  }
}
