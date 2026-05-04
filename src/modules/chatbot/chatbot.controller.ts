import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common';

import { ChatbotService } from './chatbot.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { IdDto } from 'src/common/dto/id.dto';
import { SessionResDto } from './dto/responses/session.res.dto';
import { GetUserSessionsResDto } from './dto/responses/get-user-sessions.res.dto';

@ApiTags('Chatbot')
@ApiBearerAuth()
@ApiExtraModels(SessionResDto, GetUserSessionsResDto)
@Controller('chatbot')
export class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

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
  findAll(@Req() req: Request, @Query() q: PaginationDto) {
    const userId = req.user!.id;
    const { page, limit } = q;
    return this.chatbotService.findAll(userId, page, limit);
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
