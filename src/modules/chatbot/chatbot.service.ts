import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import FormData from 'form-data';
import { Readable } from 'stream';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { fileTypeFromBuffer } from 'file-type';
import { AttachmentType, MessageRole, Prisma } from '@prisma/client';

import {
  FindMessagesPayload,
  FindSessionsPayload,
  ProcessMessagePayload,
  RenameChatSessionPayload,
  ExternalApiStreamResponse,
  HandleStreamEventsPayload,
  RenameChatSessionExternalApiPayload,
  PersistStreamedMessageAndTitlePayload,
} from './chatbot.types';
import { AppConfig } from 'src/config/configuration';
import { HttpResponse } from 'src/common/types/api.types';
import { SessionResDto } from './dto/responses/session.res.dto';
import { winstonLogger as logger } from 'src/config/logger.config';
import ChatSessionsRepository from './repositories/sessions.repository';
import ChatMessagesRepository from './repositories/messages.repository';
import { ChatbotMessageResDto } from './dto/responses/chatbot-message.res.dto';
import { GetUserSessionsResDto } from './dto/responses/get-user-sessions.res.dto';

@Injectable()
export default class ChatbotService {
  constructor(
    private readonly httpService: HttpService,
    private readonly sessionsRepo: ChatSessionsRepository,
    private readonly chatbotMessagesRepo: ChatMessagesRepository,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  async processMessageStream({
    image,
    voice,
    userId,
    content,
    sessionId,
    subscriber,
    voiceDuration,
    abortController,
  }: ProcessMessagePayload) {
    try {
      // Check if the session exists and belongs to the user
      const session = await this.findSessionOrThrow(sessionId, userId);

      // Save user message in the database before using AI service
      await this.chatbotMessagesRepo.create({
        content,
        role: MessageRole.USER,
        sessionId: session.id,
        attachments: {
          createMany: {
            data: [
              ...(image
                ? [
                    await this.getMessageAttachmentCreateInput({
                      file: image,
                      type: AttachmentType.IMAGE,
                    }),
                  ]
                : []),
              ...(voice
                ? [
                    await this.getMessageAttachmentCreateInput({
                      file: voice,
                      type: AttachmentType.AUDIO,
                      voiceDuration: voiceDuration,
                    }),
                  ]
                : []),
            ],
          },
        },
      });

      // Check if session had more than 1 messages
      const hasMultipleMessages =
        await this.chatbotMessagesRepo.hasMultipleMessages(session.id);

      // This was the first message in the session?? Need to update the session's title (temporarly until we have the better title generation from the model)
      if (!hasMultipleMessages) {
        await this.updateTitle({
          sessionId: session.id,
          userId,
          newTitle: content.slice(0, 60),
        });
      }

      // Make the external API call to process the message and stream the response back to the client
      const stream = await this.callExternalChatStream({
        content,
        abortController,
        userId,
        sessionId,
        image,
        voice,
      });

      let buffer = '',
        persisted = false,
        assembledResponse = '',
        newTitle: string | undefined = undefined;
      stream.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();

        // These are the processable / completed lines received so far
        const lines = buffer.split('\n');

        // Keep the last (potentially incomplete) line in the buffer
        // This is needed to make sure we don't parse incomplete lines
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();

          // Make sure that the line is a valid data event
          if (!trimmed.startsWith('data:')) continue;

          const jsonStr = trimmed.slice('data:'.length).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr) as ExternalApiStreamResponse;

            switch (event.type) {
              case 'chunk':
                if (event.content) {
                  // This is needed to persist the message in the database once the stream ends
                  const content = Array.isArray(event.content)
                    ? event.content[0].text
                    : event.content;

                  assembledResponse += content;

                  // Stream the chunk to the client
                  subscriber.next({
                    data: { delta: content },
                  });
                }
                break;

              case 'end':
                // Stream completed
                this.persistAssistantMessageAndUpdateSessionTitle({
                  newTitle,
                  persisted,
                  sessionId,
                  assembledResponse,
                })
                  .then((p) => {
                    subscriber.next({ data: '[DONE]' });
                    subscriber.complete();

                    persisted = p;
                  })
                  .catch((err: unknown) => {
                    logger.error(
                      'Failed to save assistant message in database',
                      {
                        error: err,
                      },
                    );

                    subscriber.next({ data: '[DONE]' });
                    subscriber.complete();
                  });
                break;

              case 'error':
                // AI service error
                subscriber.next({
                  data: {
                    error:
                      'Failed to process the message, please try again later.',
                  },
                });

                this.persistAssistantMessageAndUpdateSessionTitle({
                  newTitle,
                  persisted,
                  sessionId,
                  assembledResponse,
                }).catch((err: unknown) => {
                  logger.error('Failed to persist on AI error', {
                    error: err,
                  });
                });

                subscriber.complete();
                break;

              case 'metadata':
                newTitle = event.chat_title;
                break;
            }
          } catch {
            // Malformed JSON line — skip
          }
        }
      });

      // Handle Stream Completion
      this.handleStreamCompletion({
        stream,
        persisted,
        sessionId,
        assembledResponse,
        newTitle,
      });

      // Handle Stream Errors
      this.handleStreamErrors({ stream, subscriber: subscriber });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        subscriber.error(error);
      } else {
        logger.error('processMessageStream failed', { error });

        subscriber.next({
          data: {
            error: 'Failed to process the message, please try again later.',
          },
        });

        subscriber.complete();
      }
    }
  }

  async findMessages({
    sessionId,
    userId,
    limit,
    skip,
  }: FindMessagesPayload): Promise<HttpResponse<ChatbotMessageResDto[]>> {
    await this.findSessionOrThrow(sessionId, userId);

    const [messages, size] = await Promise.all([
      this.chatbotMessagesRepo.findMany({
        sessionId,
        limit,
        skip,
      }),
      this.chatbotMessagesRepo.count(sessionId),
    ]);

    return {
      data: messages.map((message) => ChatbotMessageResDto.fromEntity(message)),
      size,
    };
  }

  async create(userId: string): Promise<HttpResponse> {
    const session = await this.sessionsRepo.create(userId);

    return {
      message: 'session created successfully',
      data: SessionResDto.fromEntity(session),
    };
  }

  async findAll({
    userId,
    limit,
    skip,
  }: FindSessionsPayload): Promise<HttpResponse> {
    const sessions = await this.sessionsRepo.findAll(userId, limit, skip);

    return {
      size: sessions.length,
      data: sessions.map((session) =>
        GetUserSessionsResDto.fromEntity(session),
      ),
    };
  }

  async findOne(id: string, userId: string): Promise<HttpResponse> {
    const session = await this.findSessionOrThrow(id, userId);
    return { data: SessionResDto.fromEntity(session) };
  }

  async deleteOne(id: string, userId: string): Promise<HttpResponse> {
    const session = await this.findSessionOrThrow(id, userId);

    if (session.isTemporary) {
      await this.deleteTemporarySessionFromExternalApi(id);
    }

    await this.sessionsRepo.deleteOne(id);
    return { message: 'Session deleted successfully.' };
  }

  // === Helpers ===
  private async findSessionOrThrow(sessionId: string, userId: string) {
    const session = await this.sessionsRepo.findById(sessionId);
    if (!session) {
      throw new NotFoundException('Chat session not found');
    }

    if (session.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this chat session',
      );
    }

    return session;
  }

  // Helper to update the chat session title both locally and in the external API
  private async updateTitle({
    sessionId,
    newTitle,
    userId,
  }: RenameChatSessionPayload) {
    await Promise.all([
      this.sessionsRepo.updateTitle({
        sessionId,
        newTitle,
      }),
      firstValueFrom(
        this.httpService.post<unknown, RenameChatSessionExternalApiPayload>(
          `${this.configService.get('EXTERNAL_API_BASE_URL')}/rename/chat`,
          {
            thread_id: sessionId,
            new_title: newTitle!,
            user_id: userId,
          },
        ),
      ).catch((error) => {
        // Request failed?? No one cares, just log it and move on
        logger.error(
          `Failed to update chat session title for session ${sessionId} via external API`,
          { error },
        );
      }),
    ]);
  }

  private async deleteTemporarySessionFromExternalApi(sessionId: string) {
    await firstValueFrom(
      this.httpService.delete(
        `${this.configService.get('EXTERNAL_API_BASE_URL')}/temporary/chat`,
        {
          data: { thread_id: sessionId },
        },
      ),
    ).catch((error) => {
      logger.error(
        `Failed to delete temporary session ${sessionId} via external API`,
        { error },
      );
    });
  }

  private async callExternalChatStream({
    image,
    voice,
    userId,
    content,
    sessionId,
    abortController,
  }: Omit<ProcessMessagePayload, 'subscriber'>) {
    const form = new FormData();
    form.append('message', content);

    if (image) {
      form.append('image', this.base64ToBuffer(image), {
        contentType: 'application/octet-stream',
      });
    }

    if (voice) {
      form.append('voice', this.base64ToBuffer(voice), {
        contentType: 'application/octet-stream',
      });
    }

    const { data: stream } = await firstValueFrom(
      this.httpService.post<Readable>(
        `${this.configService.get('EXTERNAL_API_BASE_URL')}/chat/${userId}/${sessionId}`,
        form,
        {
          headers: form.getHeaders(),
          responseType: 'stream', // Tells axios not to buffer the response and return a ReadableStream instead
          signal: abortController.signal, // Link the request to AbortController, if `.abort()` is called => the request will be cancelled mid flight
        },
      ),
    );

    return stream;
  }

  private async persistAssistantMessageAndUpdateSessionTitle({
    newTitle,
    persisted,
    sessionId,
    assembledResponse,
  }: PersistStreamedMessageAndTitlePayload) {
    if (persisted) return true;

    const promiseArray = [];

    promiseArray.push(
      this.sessionsRepo.updateTitleAndTouch({
        sessionId,
        newTitle,
      }),
    );

    if (assembledResponse.length > 0) {
      promiseArray.push(
        this.chatbotMessagesRepo.create({
          content: assembledResponse,
          role: MessageRole.ASSISTANT,
          sessionId,
        }),
      );
    }

    await Promise.all(promiseArray);
    return true;
  }

  private handleStreamErrors({
    stream,
    subscriber,
  }: HandleStreamEventsPayload) {
    stream.on('error', (err: Error) => {
      // Aborted requests are expected when client disconnects
      if (err.name === 'CanceledError' || err.name === 'AbortError') {
        return;
      }

      logger.error('AI stream error', { error: err });
      subscriber.next({
        data: {
          error: 'Failed to process the message, please try again later.',
        },
      });

      subscriber.complete();
    });
  }

  private handleStreamCompletion({
    stream,
    newTitle,
    persisted,
    sessionId,
    assembledResponse,
  }: Pick<HandleStreamEventsPayload, 'stream'> &
    PersistStreamedMessageAndTitlePayload) {
    stream.on('end', () => {
      if (assembledResponse.length !== 0) {
        this.persistAssistantMessageAndUpdateSessionTitle({
          newTitle,
          persisted,
          sessionId,
          assembledResponse,
        }).catch((err) => {
          logger.error('Failed to persist assistant message on stream end', {
            error: err,
          });
        });
      }
    });
  }

  private base64ToBuffer(file: string): Buffer {
    // base64 => file
    return Buffer.from(file, 'base64');
  }

  private async getMessageAttachmentCreateInput({
    file,
    type,
    voiceDuration,
  }: {
    file: string;
    type: AttachmentType;
    voiceDuration?: number | undefined;
  }): Promise<Omit<Prisma.MessageAttachmentUncheckedCreateInput, 'messageId'>> {
    const buffer = this.base64ToBuffer(file);

    return {
      url: file,
      type,
      mimeType:
        (await fileTypeFromBuffer(buffer))?.mime || 'application/octet-stream',
      sizeBytes: Buffer.byteLength(file, 'base64'),
      durationSeconds: voiceDuration ?? null,
    };
  }
}
