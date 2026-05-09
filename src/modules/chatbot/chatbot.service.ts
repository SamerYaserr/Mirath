import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import FormData from 'form-data';
import { Readable } from 'stream';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { AttachmentType, MessageRole, MessageType } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

import {
  FindMessagesPayload,
  FindSessionsPayload,
  ProcessMessagePayload,
  ProcessImageMessagePayload,
  RenameChatSessionPayload,
  ExternalApiStreamResponse,
  HandleStreamEventsPayload,
  RenameChatSessionExternalApiPayload,
  PersistStreamedMessageAndTitlePayload,
  CallExternalChatStreamParams,
  AddFeedbackParams,
} from './chatbot.types';
import { AppConfig } from 'src/config/configuration';
import { HttpResponse } from 'src/common/types/api.types';
import { SessionResDto } from './dto/responses/session.res.dto';
import { winstonLogger as logger } from 'src/config/logger.config';
import ChatSessionsRepository from './repositories/sessions.repository';
import ChatMessagesRepository from './repositories/messages.repository';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ChatbotMessageResDto } from './dto/responses/chatbot-message.res.dto';
import { GetUserSessionsResDto } from './dto/responses/get-user-sessions.res.dto';
import { EXT_TO_MIME } from './chatbot.types';
import { PrismaService } from '../prisma/prisma.service';
import MessageFeedbacksRepository from './repositories/message-feedbacks.repository';

@Injectable()
export default class ChatbotService {
  constructor(
    private readonly httpService: HttpService,
    private readonly sessionsRepo: ChatSessionsRepository,
    private readonly chatbotMessagesRepo: ChatMessagesRepository,
    private readonly messageFeedbacksRepo: MessageFeedbacksRepository,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly cloudinaryService: CloudinaryService,
    private prisma: PrismaService,
  ) {}

  async processMessageStream({
    userId,
    content,
    sessionId,
    subscriber,
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

  async processImageMessageStream({
    userId,
    sessionId,
    file,
    content,
    abortController,
    subscriber,
  }: ProcessImageMessagePayload) {
    try {
      await this.findSessionOrThrow(sessionId, userId);

      const { secure_url } = await this.cloudinaryService.uploadFile(
        file,
        'mirath/chatbot',
      );

      await this.chatbotMessagesRepo.createWithAttachment(
        {
          sessionId,
          role: MessageRole.USER,
          type: MessageType.IMAGE,
          content: content ?? '',
        },
        {
          type: AttachmentType.IMAGE,
          url: secure_url,
          mimeType: file.mimetype,
          sizeBytes: file.size,
        },
      );

      const hasMultipleMessages =
        await this.chatbotMessagesRepo.hasMultipleMessages(sessionId);

      if (!hasMultipleMessages) {
        const titleCandidate = content ? content.slice(0, 60) : 'Image message';

        await this.updateTitle({
          sessionId,
          userId,
          newTitle: titleCandidate,
        });
      }

      let stream: Readable;
      try {
        stream = await this.callExternalChatStream({
          content,
          file,
          abortController,
          userId,
          sessionId,
        });
      } catch (aiError) {
        // ai call failed after cloudinary upload
        console.error('AI service call failed', {
          error: aiError,
          sessionId,
          userId,
        });
        await this.cloudinaryService
          .deleteFile(secure_url)
          .catch((err: unknown) =>
            logger.error('Failed to cleanup Cloudinary file after AI error', {
              err,
            }),
          );
        throw new BadGatewayException(
          'AI service failed to process the image. Please try again later.',
        );
      }

      let buffer = '',
        persisted = false,
        assembledResponse = '',
        newTitle: string | undefined = undefined;

      stream.on('data', (chunk: Buffer) => {
        buffer += chunk.toString();
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith('data:')) continue;

          const jsonStr = trimmed.slice('data:'.length).trim();
          if (!jsonStr) continue;

          try {
            const event = JSON.parse(jsonStr) as ExternalApiStreamResponse;

            switch (event.type) {
              case 'chunk':
                if (event.content) {
                  const delta = Array.isArray(event.content)
                    ? event.content[0].text
                    : event.content;

                  assembledResponse += delta;
                  subscriber.next({ data: { delta } });
                }
                break;

              case 'end':
                this.persistAssistantImageMessage({
                  persisted,
                  sessionId,
                  assembledResponse,
                  newTitle,
                })
                  .then(({ persisted: p, messageId }) => {
                    persisted = p;

                    // persist any image URLs found in ai response
                    if (messageId) {
                      this.persistAiImageAttachments(
                        messageId,
                        assembledResponse,
                      ).catch((err: unknown) =>
                        logger.error('Failed to persist AI image attachments', {
                          err,
                        }),
                      );
                    }

                    subscriber.next({ data: '[DONE]' });
                    subscriber.complete();
                  })
                  .catch((err: unknown) => {
                    logger.error('Failed to persist assistant image message', {
                      err,
                    });
                    subscriber.next({ data: '[DONE]' });
                    subscriber.complete();
                  });
                break;

              case 'error':
                subscriber.next({
                  data: {
                    error:
                      'Failed to process the message, please try again later.',
                  },
                });
                this.cloudinaryService
                  .deleteFile(secure_url)
                  .catch((err: unknown) =>
                    logger.error(
                      'Failed to cleanup Cloudinary file after AI stream error',
                      { err },
                    ),
                  );

                subscriber.complete();
                break;

              case 'metadata':
                newTitle = event.chat_title;
                break;
            }
          } catch {
            // malformed JSON - skip
          }
        }
      });

      this.handleStreamErrors({ stream, subscriber });

      stream.on('end', () => {
        if (!persisted && assembledResponse.length > 0) {
          this.persistAssistantImageMessage({
            persisted,
            sessionId,
            assembledResponse,
            newTitle,
          })
            .then(({ messageId }) => {
              if (messageId) {
                return this.persistAiImageAttachments(
                  messageId,
                  assembledResponse,
                );
              }
              return;
            })
            .catch((err: unknown) => {
              logger.error(
                'Failed to persist assistant message on stream end',
                { err },
              );
            });
        }
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadGatewayException
      ) {
        subscriber.error(error);
      } else {
        logger.error('processImageMessageStream failed', { error });
        subscriber.next({
          data: {
            error: 'Failed to process the image, please try again later.',
          },
        });
        subscriber.complete();
      }
    }
  }

  async addFeedback({
    userId,
    sessionId,
    messageId,
    feedbackType,
  }: AddFeedbackParams): Promise<HttpResponse> {
    await this.findSessionOrThrow(sessionId, userId);
    const message = await this.findMessageOrThrow(messageId, sessionId);

    if (message.role !== 'ASSISTANT')
      throw new BadRequestException('You can only rate AI responses');

    const active = await this.prisma.$transaction(async (tx) => {
      if (!message.feedback) {
        await this.messageFeedbacksRepo.create(
          userId,
          messageId,
          feedbackType,
          tx,
        );
        return true;
      } else if (message.feedback.type === feedbackType) {
        await this.messageFeedbacksRepo.delete(message.feedback.id, tx);
        return false;
      } else {
        await this.messageFeedbacksRepo.update(
          message.feedback.id,
          feedbackType,
          tx,
        );
        return true;
      }
    });

    return {
      message: `Feedback ${active ? 'added' : 'removed'}`,
      data: {
        messageId,
        type: feedbackType,
        active,
      },
    };
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

  private async findMessageOrThrow(messageId: string, sessionId: string) {
    const message = await this.chatbotMessagesRepo.findOne(messageId);
    if (!message || message.sessionId !== sessionId) {
      throw new NotFoundException('Message not found');
    }

    return message;
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
    userId,
    file,
    content,
    sessionId,
    abortController,
  }: CallExternalChatStreamParams) {
    const form = new FormData();
    if (content) {
      form.append('message', content);
    }

    if (file) {
      form.append('image', file.buffer, {
        filename: file.originalname,
        contentType: file.mimetype,
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

  /**
   * persist the assistant message from an image stream and update the session title.
   * returns the created message's id so callers can attach image-url attachments to it.
   */
  private async persistAssistantImageMessage({
    persisted,
    sessionId,
    assembledResponse,
    newTitle,
  }: PersistStreamedMessageAndTitlePayload): Promise<{
    persisted: boolean;
    messageId: string | undefined;
  }> {
    if (persisted) return { persisted: true, messageId: undefined };

    await this.sessionsRepo.updateTitleAndTouch({ sessionId, newTitle });

    if (assembledResponse.length === 0) {
      return { persisted: true, messageId: undefined };
    }

    const message = await this.chatbotMessagesRepo.create({
      content: assembledResponse,
      role: MessageRole.ASSISTANT,
      sessionId,
      type: MessageType.TEXT,
    });

    return { persisted: true, messageId: message.id };
  }

  /* extract image urls from an ai response string and persist them as
  messageAttachment rows linked to the given assistant message */
  private async persistAiImageAttachments(
    messageId: string,
    text: string,
  ): Promise<void> {
    const URL_REGEX = /https?:\/\/[^\s"'<>)]+\.(?:jpg|jpeg|png|webp|gif)/gi;
    const urls = text.match(URL_REGEX);
    if (!urls || urls.length === 0) return;

    const unique = [...new Set(urls)];

    await Promise.all(
      unique.map((url) => {
        const ext = url.split('.').pop()?.toLowerCase() ?? '';
        const mimeType = EXT_TO_MIME[ext] ?? 'image/jpeg';
        return this.chatbotMessagesRepo.createAttachment(messageId, {
          type: AttachmentType.IMAGE,
          url,
          mimeType,
          sizeBytes: 0,
        });
      }),
    );
  }
}
