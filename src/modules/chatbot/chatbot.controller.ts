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
  UploadedFile,
  UseInterceptors,
  RequestMethod,
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
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { SessionResDto } from './dto/responses/session.res.dto';
import { HttpResponse, SseEvent } from 'src/common/types/api.types';
import { ChatbotMessageResDto } from './dto/responses/chatbot-message.res.dto';
import { CreateChatbotMessageReqDto } from './dto/requests/create-chatbot-message.req.dto';
import { GetUserSessionsResDto } from './dto/responses/get-user-sessions.res.dto';
import { SubmitFeedbackResDto } from './dto/responses/submit-feedback.res.dto';
import {
  SubmitFeedbackReqBodyDto,
  SubmitFeedbackReqParamsDto,
} from './dto/requests/submit-feedback.req.dto';
import { TemporarySessionResDto } from './dto/responses/temporary-session.res.dto';
import { UploadChatFileReqDto } from './dto/requests/upload-chat-file.req.dto';
import { ChatFilePipe } from 'src/common/pipes/chat-file.pipe';
import { ChatFileResDto } from './dto/responses/chat-file.res.dto';
import { ChatbotStreamDataEvent } from './chatbot.types';

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

  @Post('files')
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Upload a file for use in a chat message',
    description:
      'Step 1 of the two-step messaging flow for images and audio. ' +
      'Upload the file here to receive a fileId, then include that fileId in ' +
      'the POST /chatbot/sessions/:id/messages SSE body. ' +
      'This separates file parsing from SSE streaming so both work correctly.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['file', 'type'],
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description:
            'Image (jpg, jpeg, png, webp, gif — max 10 MB) or ' +
            'audio (mp3, mp4, wav, webm, m4a, ogg — max 25 MB)',
        },
        type: {
          type: 'string',
          enum: ['IMAGE', 'AUDIO'],
          description:
            'Declares the file type so the correct pipe validation is applied.',
        },
        durationSeconds: {
          type: 'integer',
          minimum: 1,
          maximum: 600,
          description: 'Audio duration in seconds. Required when type = AUDIO.',
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description:
      'File uploaded successfully. Use the returned id in the stream endpoint.',
    schema: { properties: { data: { $ref: getSchemaPath(ChatFileResDto) } } },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Invalid file type, file too large, or missing durationSeconds for audio.',
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  uploadFile(
    @Req() req: Request,
    @Body() dto: UploadChatFileReqDto,
    @UploadedFile(ChatFilePipe) file: Express.Multer.File,
  ): Promise<HttpResponse<ChatFileResDto>> {
    return this.chatbotService.uploadFile(req.user!.id, file, dto);
  }

  @Sse('sessions/:id/messages', { method: RequestMethod.POST })
  @ApiOperation({
    summary: 'Send a message and stream the AI reply',
    description:
      'Step 2 of the messaging flow. Accepts a JSON body with an optional text ' +
      'message and an optional fileId (from POST /chatbot/files). ' +
      'The AI reply is streamed back as Server-Sent Events. ' +
      'Audio messages additionally emit a transcription event before the AI reply.',
  })
  @ApiBody({ type: CreateChatbotMessageReqDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'SSE stream opened. Read frames until `[DONE]` or an error event.',
    content: {
      'text/event-stream': {
        schema: { type: 'string' },
        examples: {
          transcription: {
            summary:
              'Audio only — transcript of the voice clip (emitted first)',
            value:
              'data: {"transcription":"What does it take to solve the measurement problem?"}\n\n',
          },
          status: {
            summary: 'AI progress update',
            value: 'data: {"status":"Searching knowledge base..."}\n\n',
          },
          answer: {
            summary: 'Complete AI answer (single event)',
            value: 'data: {"delta":"The measurement problem refers to..."}\n\n',
          },
          error: {
            summary: 'Error event',
            value:
              'data: {"error":"Failed to process the message, please try again later."}\n\n',
          },
          done: { summary: 'Completion sentinel', value: 'data: "[DONE]"\n\n' },
        },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Neither content nor fileId provided.',
  })
  @ApiNotFoundResponse({ description: 'Chat session or file not found.' })
  @ApiForbiddenResponse({
    description: 'You do not have access to this chat session.',
  })
  streamMessage(
    @Req() req: Request,
    @Param() { id }: IdDto,
    @Body() dto: CreateChatbotMessageReqDto,
  ): Observable<SseEvent<ChatbotStreamDataEvent>> {
    return new Observable((subscriber) => {
      const abortController = new AbortController();
      console.log(dto);

      this.chatbotService.processStream({
        sessionId: id,
        userId: req.user!.id,
        content: dto.content,
        fileId: dto.fileId,
        abortController,
        subscriber,
      });

      return () => abortController.abort();
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
    return this.chatbotService.findOne(id, req.user!.id);
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
    return this.chatbotService.submitFeedback({
      userId: req.user!.id,
      sessionId,
      messageId,
      ...dto,
    });
  }
}
