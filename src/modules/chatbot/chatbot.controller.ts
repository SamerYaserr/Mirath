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
  ApiBadGatewayResponse,
} from '@nestjs/swagger';

import { IdDto } from 'src/common/dto/id.dto';
import ChatbotService from './chatbot.service';
import {
  ChatbotAudioDataEvent,
  ChatbotMessageDataEvent,
} from './chatbot.types';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { SessionResDto } from './dto/responses/session.res.dto';
import { HttpResponse, SseEvent } from 'src/common/types/api.types';
import { ChatbotMessageResDto } from './dto/responses/chatbot-message.res.dto';
import { CreateChatbotMessageReqDto } from './dto/requests/create-chatbot-message.req.dto';
import { UploadChatImageReqDto } from './dto/requests/upload-chat-image.req.dto';
import { ChatAudioReqDto } from './dto/requests/chat-audio.req.dto';
import { GetUserSessionsResDto } from './dto/responses/get-user-sessions.res.dto';
import { SubmitFeedbackResDto } from './dto/responses/submit-feedback.res.dto';
import { ChatImagePipe } from '../../common/pipes/chat-image.pipe';
import {
  SubmitFeedbackReqBodyDto,
  SubmitFeedbackReqParamsDto,
} from './dto/requests/submit-feedback.req.dto';
import { ChatAudioPipe } from '../../common/pipes/chat-audio.pipe';
import { TemporarySessionResDto } from './dto/responses/temporary-session.res.dto';

@ApiTags('Chatbot')
@ApiBearerAuth()
@ApiExtraModels(
  ChatbotMessageResDto,
  SessionResDto,
  GetUserSessionsResDto,
  SubmitFeedbackResDto,
  TemporarySessionResDto,
)
@Controller('chatbot')
export default class ChatbotController {
  constructor(private readonly chatbotService: ChatbotService) {}

  @Sse('sessions/:id/messages')
  @ApiOperation({ summary: 'Stream a chatbot reply for a session message' })
  @ApiBody({ type: CreateChatbotMessageReqDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Stream opened. Read SSE frames until `[DONE]` or an error event.',
    content: {
      'text/event-stream': {
        schema: {
          type: 'string',
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
          done: { summary: 'Completion sentinel', value: 'data: "[DONE]"\n\n' },
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

      return () => abortController.abort();
    });
  }

  @Post('sessions/:id/messages/upload')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload an image and stream a chatbot reply',
    description:
      'Accepts multipart/form-data with an image file (max 10 MB, jpg/jpeg/png/webp/gif) ' +
      'and an optional text message. Uploads the image to Cloudinary, persists the user ' +
      'message, and streams the AI reply as SSE.',
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
          description: 'Image file (jpg, jpeg, png, webp, gif — max 10 MB)',
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
    description: 'SSE stream opened. Same frame format as the text endpoint.',
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

  @Post('sessions/:id/messages/audio')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload a voice message and stream the AI reply',
    description:
      'Records are uploaded as standard multipart blobs; the backend ' +
      'never manages a live audio stream.  The file is uploaded to Cloudinary ' +
      '(resource_type: video), forwarded to the AI service for transcription, ' +
      'and the transcript + AI reply are streamed back as SSE.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'durationSeconds'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'Audio file (mp3, mp4, wav, webm, m4a, ogg — max 25 MB)',
        },
        durationSeconds: {
          type: 'integer',
          minimum: 1,
          maximum: 600,
          description: 'Duration of the recorded clip in whole seconds',
          example: 42,
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'SSE stream opened.',
    content: {
      'text/event-stream': {
        schema: { type: 'string' },
        examples: {
          transcription: {
            summary: 'First event - transcription',
            value:
              'data: {"transcription":"What does it take to solve the measurement problem?"}\n\n',
          },
          delta: {
            summary: 'Assistant chunk event',
            value: 'data: {"delta":"The measurement problem refers to..."}\n\n',
          },
          done: { summary: 'Completion sentinel', value: 'data: "[DONE]"\n\n' },
          error: {
            summary: 'AI-layer error',
            value:
              'data: {"error":"AI service failed to process the voice message."}\n\n',
          },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'File too large (>25 MB), unsupported audio format, or durationSeconds out of range.',
  })
  @ApiNotFoundResponse({ description: 'Chat session not found' })
  @ApiForbiddenResponse({
    description: 'You do not have access to this chat session',
  })
  @ApiBadGatewayResponse({
    description:
      'Cloudinary upload succeeded but the AI service call failed. ' +
      'The uploaded file is automatically deleted.',
  })
  async streamAudioMessage(
    @Req() req: Request,
    @Res() res: Response,
    @Param() { id }: IdDto,
    @Body() dto: ChatAudioReqDto,
    @UploadedFile(ChatAudioPipe) file: Express.Multer.File,
  ): Promise<void> {
    let headersFlushed = false;

    const flushHeaders = () => {
      if (!headersFlushed) {
        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');
        res.setHeader('X-Accel-Buffering', 'no');
        res.flushHeaders();
        headersFlushed = true;
      }
    };

    const abortController = new AbortController();
    req.on('close', () => abortController.abort());

    return new Promise((resolve) => {
      const subscriber = {
        next: (event: SseEvent<ChatbotAudioDataEvent>) => {
          flushHeaders();
          res.write(`data: ${JSON.stringify(event.data)}\n\n`);
        },
        error: (err: unknown) => {
          if (!headersFlushed) {
            res.destroy(err instanceof Error ? err : new Error(String(err)));
          } else {
            res.end();
          }
          resolve();
        },
        complete: () => {
          flushHeaders();
          res.end();
          resolve();
        },
      };

      this.chatbotService
        .processAudioMessageStream({
          userId: req.user!.id,
          sessionId: id,
          audioFile: file,
          durationSeconds: dto.durationSeconds,
          abortController,
          subscriber: subscriber as any,
        })
        .catch((err: unknown) => {
          subscriber.error(err);
        });
    });
  }

  @Get('sessions/:id/history')
  @ApiOperation({
    summary: 'List chatbot messages',
    description:
      'Returns the messages for a chat session in chronological order. ' +
      'Audio messages include an attachment with durationSeconds for the ' +
      'waveform playback counter.',
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

  @Post('sessions/temporary')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create a temporary chat session',
    description:
      'Creates a short-lived chat session that is never shown in the session ' +
      'history list. The session expires after 24 hours of inactivity; ' +
      'the TTL is reset on every new message. Use ' +
      'DELETE /chatbot/sessions/temporary/:id to end it early.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Temporary chat session created successfully.',
    schema: {
      properties: {
        data: { $ref: getSchemaPath(TemporarySessionResDto) },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  createTemporary(@Req() req: Request) {
    return this.chatbotService.createTemporary(req.user!.id);
  }

  @Delete('sessions/temporary/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Explicitly end a temporary chat session',
    description:
      'Immediately deletes a temporary session, all its messages, and ' +
      'cleans up the AI-side thread. Returns 400 if the session is not ' +
      'temporary — use DELETE /chatbot/sessions/:id for regular sessions.',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Temporary session deleted successfully.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'The specified session is not a temporary session.',
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  @ApiNotFoundResponse({ description: 'No session found with this id.' })
  @ApiForbiddenResponse({
    description: 'You do not have permission to delete this temporary session.',
  })
  deleteTemporary(@Req() req: Request, @Param() { id }: IdDto) {
    return this.chatbotService.deleteTemporary(id, req.user!.id);
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
    return this.chatbotService.create(req.user!.id);
  }

  @Get('sessions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all chat sessions for the current user',
    description:
      'Returns a paginated list of chat sessions belonging to the authenticated user, ' +
      'ordered by most recently updated. Each session includes a preview of the last message. ' +
      'Temporary sessions are excluded from this list.',
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
    return this.chatbotService.findAll({ userId: req.user!.id, limit, skip });
  }

  @Get('sessions/:id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get a single chat session by ID',
    description:
      'Retrieves the full details of a specific chat session. ' +
      'The session must belong to the authenticated user. ' +
      'Temporary sessions are accessible via direct ID lookup.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    schema: { properties: { data: { $ref: getSchemaPath(SessionResDto) } } },
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
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  @ApiNotFoundResponse({ description: 'No session found with this id.' })
  @ApiForbiddenResponse({
    description: 'You do not have permission to delete this chat session.',
  })
  deleteOne(@Req() req: Request, @Param() { id }: IdDto) {
    return this.chatbotService.deleteOne(id, req.user!.id);
  }

  @Post('sessions/:sessionId/messages/:messageId/feedback')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Submit Feedback',
    description:
      'Allows a user to submit, update, or remove feedback (thumbs up/down) for an AI response.',
  })
  @ApiBody({ type: SubmitFeedbackReqBodyDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Feedback added/removed.',
    schema: {
      properties: {
        message: { type: 'string', example: 'Feedback added' },
        data: { $ref: getSchemaPath(SubmitFeedbackResDto) },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'You can only rate AI responses',
  })
  @ApiNotFoundResponse({ description: 'Chat session/message not found' })
  @ApiForbiddenResponse({
    description: 'You do not have access to this chat session/message',
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
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
