import { Observable } from 'rxjs';
import type { Request } from 'express';
import {
  Req,
  Sse,
  Get,
  Body,
  Post,
  Param,
  Query,
  Delete,
  HttpCode,
  Controller,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiQuery,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
  getSchemaPath,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { IdDto } from 'src/common/dto/id.dto';
import ChatbotService from './chatbot.service';
import { HttpResponse, SseEvent } from 'src/common/types/api.types';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { SessionResDto } from './dto/responses/session.res.dto';
import { ChatbotMessageResDto } from './dto/responses/chatbot-message.res.dto';
import { CreateChatbotMessageReqDto } from './dto/requests/create-chatbot-message.req.dto';
import { GetUserSessionsResDto } from './dto/responses/get-user-sessions.res.dto';
import { ChatbotMessageDataEvent } from './chatbot.types';

@ApiTags('Chatbot')
@ApiBearerAuth()
@ApiExtraModels(ChatbotMessageResDto, SessionResDto, GetUserSessionsResDto)
@Controller('chatbot')
export default class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Sse('sessions/:id/messages')
  streamMessage(
    @Req() req: Request,
    @Param() { id }: IdDto,
    @Body() dto: CreateChatbotMessageReqDto,
  ): Observable<SseEvent<ChatbotMessageDataEvent>> {
    return new Observable((subscriber) => {
      const abortController = new AbortController();

      this.chatbotService.processMessageStream({
        sessionId: id,
        userId: req.user!.id,
        abortController,
        subscriber,
        ...dto,
      });

      return () => {
        abortController.abort();
      };
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

  @Post('sessions')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a new chat session',
    description:
      'Creates a new chat session for the authenticated user. ' +
      'The session starts with a default title of "New Chat" and is persistent (not temporary).',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Chat session created successfully.',
    schema: {
      properties: {
        message: { type: 'string', example: 'session created successfully' },
        data: { $ref: getSchemaPath(SessionResDto) },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  create(@Req() req: Request) {
    const userId = req.user!.id;
    return this.chatbotService.create(userId);
  }

  @Get('sessions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all chat sessions for the current user',
    description:
      'Returns a paginated list of chat sessions belonging to the authenticated user, ' +
      'ordered by most recently updated. Each session includes a preview of the last message.',
  })
  @ApiQuery({ type: PaginationDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Chat sessions retrieved successfully.',
    schema: {
      properties: {
        size: { type: 'number', example: 5 },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(GetUserSessionsResDto) },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  findAll(@Req() req: Request, @Query() { limit, skip }: PaginationDto) {
    const userId = req.user!.id;
    return this.chatbotService.findAll({ userId, limit, skip });
  }

  @Get('sessions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a single chat session by ID',
    description:
      'Retrieves the full details of a specific chat session. ' +
      'The session must belong to the authenticated user.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: {
      properties: {
        data: { $ref: getSchemaPath(SessionResDto) },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  @ApiNotFoundResponse({ description: 'No session found with this id.' })
  @ApiForbiddenResponse({
    description: 'You do not have permission to access this chat session.',
  })
  findOne(@Req() req: Request, @Param() { id }: IdDto) {
    const userId = req.user!.id;
    return this.chatbotService.findOne(id, userId);
  }

  @Delete('sessions/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a chat session',
    description:
      'Permanently deletes a chat session and all its messages. ' +
      'The session must belong to the authenticated user.',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Chat session deleted successfully.',
    schema: {
      properties: {
        message: { type: 'string', example: 'Session deleted successfully.' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  @ApiNotFoundResponse({ description: 'No session found with this id.' })
  @ApiForbiddenResponse({
    description: 'You do not have permission to delete this chat session.',
  })
  deleteOne(@Req() req: Request, @Param() { id }: IdDto) {
    const userId = req.user!.id;
    return this.chatbotService.deleteOne(id, userId);
  }
}
