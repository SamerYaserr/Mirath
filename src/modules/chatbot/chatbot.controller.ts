import { Observable } from 'rxjs';
import type { Request, Response } from 'express';
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
  UploadedFile,
  UseInterceptors,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiTags,
  ApiBody,
  ApiQuery,
  ApiResponse,
  ApiOperation,
  ApiBearerAuth,
  getSchemaPath,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiUnauthorizedResponse,
  ApiConsumes,
} from '@nestjs/swagger';

import { IdDto } from 'src/common/dto/id.dto';
import ChatbotService from './chatbot.service';
import { ChatbotMessageDataEvent } from './chatbot.types';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { SessionResDto } from './dto/responses/session.res.dto';
import { HttpResponse, SseEvent } from 'src/common/types/api.types';
import { ChatbotMessageResDto } from './dto/responses/chatbot-message.res.dto';
import { CreateChatbotMessageReqDto } from './dto/requests/create-chatbot-message.req.dto';
import { UploadChatImageReqDto } from './dto/requests/upload-chat-image.req.dto';
import { GetUserSessionsResDto } from './dto/responses/get-user-sessions.res.dto';
import { ChatImagePipe } from '../../common/pipes/chat-image.pipe';
import {
  SubmitFeedbackReqBodyDto,
  SubmitFeedbackReqParamsDto,
} from './dto/requests/submit-feedback.req.dto';

@ApiTags('Chatbot')
@ApiBearerAuth()
@ApiExtraModels(ChatbotMessageResDto, SessionResDto, GetUserSessionsResDto)
@Controller('chatbot')
export default class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Sse('sessions/:id/messages')
  @ApiOperation({
    summary: 'Stream a chatbot reply for a session message',
  })
  @ApiBody({
    type: CreateChatbotMessageReqDto,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Stream opened successfully. The client should keep reading SSE data frames until it receives the `[DONE]` sentinel or an error event.',
    content: {
      'text/event-stream': {
        schema: {
          type: 'string',
          description:
            'Raw SSE frame. The payload after `data:` is a JSON string for chunk and error events, or the string `[DONE]` for completion.',
          example: 'data: {"delta":"The paper argues that..."}\n\n',
        },
        examples: {
          chunk: {
            summary: 'Assistant chunk event',
            value: 'data: {"delta":"The paper argues that..."}\n\n',
          },
          error: {
            summary: 'Stream error event',
            value:
              'data: {"error":"Failed to process the message, please try again later."}\n\n',
          },
          done: {
            summary: 'Completion sentinel',
            value: 'data: "[DONE]"\n\n',
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'Chat session not found' })
  @ApiForbiddenResponse({
    description: 'You do not have access to this chat session',
  })
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

  @Post('sessions/:id/messages/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload an image and stream a chatbot reply',
    description:
      'Accepts a multipart/form-data body with an image file (max 10 MB, jpg/jpeg/png/webp/gif) and an optional text message. Uploads the image to Cloudinary, persists the user message, and streams the AI reply as SSE.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Image file (jpg, jpeg, png, webp, gif - max 10 MB)',
        },
        content: {
          type: 'string',
          description: 'Optional text message to accompany the image',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SSE stream opened. Same format as the text message endpoint.',
  })
  @ApiNotFoundResponse({ description: 'Chat session not found' })
  @ApiForbiddenResponse({
    description: 'You do not have access to this chat session',
  })
  async streamImageMessage(
    @Req() req: Request,
    @Res() res: Response,
    @Param() { id }: IdDto,
    @Body() dto: UploadChatImageReqDto,
    @UploadedFile(ChatImagePipe) file: Express.Multer.File,
  ): Promise<void> {
    // Set SSE headers and flush immediately so client knows stream is open
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no');
    res.flushHeaders();

    const abortController = new AbortController();
    req.on('close', () => abortController.abort());

    return new Promise((resolve) => {
      const subscriber = {
        next: (event: SseEvent<ChatbotMessageDataEvent>) => {
          res.write(`data: ${JSON.stringify(event.data)}\n\n`);
        },
        error: () => {
          res.end();
          resolve();
        },
        complete: () => {
          res.end();
          resolve();
        },
      };

      this.chatbotService.processImageMessageStream({
        userId: req.user!.id,
        sessionId: id,
        file,
        content: dto.content ?? '',
        abortController,
        subscriber: subscriber as any,
      });
    });
  }

  @Get('sessions/:id/history')
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

  @Post('sessions/:sessionId/messages/:messageId/feedback')
  submitFeedback(
    @Req() req: Request,
    @Body() dto: SubmitFeedbackReqBodyDto,
    @Param() { sessionId, messageId }: SubmitFeedbackReqParamsDto,
  ) {
    const userId = req.user!.id;
    return this.chatbotService.submitFeedback({
      userId,
      sessionId,
      messageId,
      ...dto,
    });
  }
}
