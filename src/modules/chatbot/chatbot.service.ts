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
  ProcessAudioMessagePayload,
  RenameChatSessionPayload,
  ExternalApiStreamResponse,
  HandleStreamEventsPayload,
  RenameChatSessionExternalApiPayload,
  PersistStreamedMessageAndTitlePayload,
  CallExternalChatStreamParams,
  SubmitFeedbackParams,
  CallExternalAudioStreamParams,
  EXT_TO_MIME,
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
import { SubmitFeedbackResDto } from './dto/responses/submit-feedback.res.dto';
import { PrismaService } from '../prisma/prisma.service';
import MessageFeedbacksRepository from './repositories/message-feedbacks.repository';
import { ExternalAiVoiceEvent } from './dto/external-ai-voice-response.dto';

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
      const session = await this.findSessionOrThrow(sessionId, userId);

      await this.chatbotMessagesRepo.create({
        content,
        role: MessageRole.USER,
        sessionId: session.id,
      });

      const hasMultipleMessages =
        await this.chatbotMessagesRepo.hasMultipleMessages(session.id);

      if (!hasMultipleMessages) {
        await this.updateTitle({
          sessionId: session.id,
          userId,
          newTitle: content.slice(0, 60),
        });
      }

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
                this.persistAssistantMessageAndUpdateSessionTitle({
                  newTitle,
                  persisted,
                  sessionId,
                  assembledResponse,
                })
                  .then((p) => {
                    persisted = p;
                    subscriber.next({ data: '[DONE]' });
                    subscriber.complete();
                  })
                  .catch((err: unknown) => {
                    logger.error('Failed to save assistant message', { err });
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
                this.persistAssistantMessageAndUpdateSessionTitle({
                  newTitle,
                  persisted,
                  sessionId,
                  assembledResponse,
                }).catch((err: unknown) => {
                  logger.error('Failed to persist on AI error', { err });
                });
                subscriber.complete();
                break;

              case 'metadata':
                newTitle = event.chat_title;
                break;
            }
          } catch {
            // malformed JSON — skip
          }
        }
      });

      this.handleStreamCompletion({
        stream,
        persisted,
        sessionId,
        assembledResponse,
        newTitle,
      });

      this.handleStreamErrors({ stream, subscriber });
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
        await this.updateTitle({
          sessionId,
          userId,
          newTitle: content ? content.slice(0, 60) : 'Image message',
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
        logger.error('AI service call failed after image upload', {
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

  async submitFeedback({
    userId,
    sessionId,
    messageId,
    feedbackType,
  }: SubmitFeedbackParams): Promise<HttpResponse> {
    await this.findSessionOrThrow(sessionId, userId);
    const message = await this.findMessageOrThrow(messageId, sessionId);

    if (message.role !== 'ASSISTANT')
      throw new BadRequestException('You can only rate AI responses');

    const active = await this.prisma.$transaction(async (tx) => {
      if (!message.feedback) {
        await this.messageFeedbacksRepo.upsertFeedback(
          userId,
          messageId,
          feedbackType,
          tx,
        );
        return true;
      } else if (message.feedback.type === feedbackType) {
        await this.messageFeedbacksRepo.deleteFeedback(message.feedback.id, tx);
        return false;
      } else {
        await this.messageFeedbacksRepo.updateFeedback(
          message.feedback.id,
          feedbackType,
          tx,
        );
        return true;
      }
    });

    return {
      message: `Feedback ${active ? 'added' : 'removed'}`,
      data: SubmitFeedbackResDto.fromEntity({
        messageId,
        type: feedbackType,
        active,
      }),
    };
  }

  // === Helpers ===
  async processAudioMessageStream({
    userId,
    sessionId,
    audioFile,
    durationSeconds,
    abortController,
    subscriber,
  }: ProcessAudioMessagePayload): Promise<void> {
    await this.findSessionOrThrow(sessionId, userId);

    const { secure_url } = await this.cloudinaryService.uploadFile(
      audioFile,
      'mirath/chatbot/audio',
      'video',
    );

    const { message: userMessage } =
      await this.chatbotMessagesRepo.createWithAttachment(
        {
          sessionId,
          role: MessageRole.USER,
          type: MessageType.AUDIO,
          content: '',
        },
        {
          type: AttachmentType.AUDIO,
          url: secure_url,
          mimeType: audioFile.mimetype,
          sizeBytes: audioFile.size,
          durationSeconds,
        },
      );

    const hasMultipleMessages =
      await this.chatbotMessagesRepo.hasMultipleMessages(sessionId);

    if (!hasMultipleMessages) {
      await this.updateTitle({
        sessionId,
        userId,
        newTitle: 'Voice message',
      });
    }

    let stream: Readable;
    try {
      stream = await this.callExternalAudioStream({
        userId,
        sessionId,
        audioFile,
        abortController,
      });
    } catch (aiError) {
      logger.error('AI service call failed after audio upload', {
        error: aiError,
        sessionId,
        userId,
      });

      await this.cloudinaryService
        .deleteFile(secure_url)
        .catch((err: unknown) =>
          logger.error(
            'Failed to cleanup Cloudinary audio file after AI call failure',
            { err },
          ),
        );

      throw new BadGatewayException(
        'AI service failed to process the voice message. Please try again later.',
      );
    }

    let buffer = '';
    let assembledResponse = '';
    let transcriptionText = '';
    let transcriptionEmitted = false;
    let persisted = false;
    let newTitle: string | undefined = undefined;

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
          const event = JSON.parse(jsonStr) as ExternalAiVoiceEvent;

          switch (event.type) {
            case 'transcription':
              transcriptionText = event.transcription ?? '';
              if (!transcriptionEmitted) {
                subscriber.next({
                  data: { transcription: transcriptionText },
                });
                transcriptionEmitted = true;
              }
              break;

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
              this.finaliseAudioStream({
                persisted,
                sessionId,
                assembledResponse,
                newTitle,
                userMessageId: userMessage.id,
                transcriptionText,
              })
                .then((p) => {
                  persisted = p;
                  subscriber.next({ data: '[DONE]' });
                  subscriber.complete();
                })
                .catch((err: unknown) => {
                  logger.error('Failed to finalise audio stream', { err });
                  subscriber.next({ data: '[DONE]' });
                  subscriber.complete();
                });
              break;

            case 'error':
              subscriber.next({
                data: {
                  error: 'AI service failed to process the voice message.',
                },
              });
              subscriber.complete();
              break;

            case 'metadata':
              newTitle = event.chat_title;
              break;
          }
        } catch {
          // malformed JSON line - skip
        }
      }
    });

    stream.on('end', () => {
      if (!persisted) {
        this.finaliseAudioStream({
          persisted,
          sessionId,
          assembledResponse,
          newTitle,
          userMessageId: userMessage.id,
          transcriptionText,
        }).catch((err: unknown) => {
          logger.error(
            'Failed to finalise audio stream on stream-end fallback',
            { err },
          );
        });
      }
    });

    stream.on('error', (err: Error) => {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;

      logger.error('AI audio stream transport error', { error: err });
      subscriber.next({
        data: {
          error: 'Failed to process the voice message, please try again later.',
        },
      });
      subscriber.complete();
    });
  }

  async findMessages({
    sessionId,
    userId,
    limit,
    skip,
  }: FindMessagesPayload): Promise<HttpResponse<ChatbotMessageResDto[]>> {
    await this.findSessionOrThrow(sessionId, userId);

    const [messages, size] = await Promise.all([
      this.chatbotMessagesRepo.findMany({ sessionId, limit, skip }),
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

  private async findSessionOrThrow(sessionId: string, userId: string) {
    const session = await this.sessionsRepo.findById(sessionId);
    if (!session) throw new NotFoundException('Chat session not found');

    if (session.userId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this chat session',
      );
    }

    return session;
  }

  private async findMessageOrThrow(messageId: string, sessionId: string) {
    const message = await this.chatbotMessagesRepo.findOne(messageId);
    if (!message) throw new NotFoundException('Message not found');

    if (message.sessionId !== sessionId)
      throw new ForbiddenException('Message does not belong to this session');

    return message;
  }

  // Helper to update the chat session title both locally and in the external API
  private async updateTitle({
    sessionId,
    newTitle,
    userId,
  }: RenameChatSessionPayload) {
    await Promise.all([
      this.sessionsRepo.updateTitle({ sessionId, newTitle }),
      firstValueFrom(
        this.httpService.post<unknown, RenameChatSessionExternalApiPayload>(
          `${this.configService.get('EXTERNAL_API_BASE_URL')}/rename/chat`,
          { thread_id: sessionId, new_title: newTitle!, user_id: userId },
        ),
      ).catch((error) => {
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
        { data: { thread_id: sessionId } },
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
  }: CallExternalChatStreamParams): Promise<Readable> {
    const form = new FormData();
    if (content) form.append('message', content);

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
          responseType: 'stream',
          signal: abortController.signal,
        },
      ),
    );

    return stream;
  }

  private async callExternalAudioStream({
    userId,
    sessionId,
    audioFile,
    abortController,
  }: CallExternalAudioStreamParams): Promise<Readable> {
    const form = new FormData();
    form.append('voice', audioFile.buffer, {
      filename: audioFile.originalname,
      contentType: audioFile.mimetype,
    });

    const { data: stream } = await firstValueFrom(
      this.httpService.post<Readable>(
        `${this.configService.get('EXTERNAL_API_BASE_URL')}/chat/${userId}/${sessionId}`,
        form,
        {
          headers: form.getHeaders(),
          responseType: 'stream',
          signal: abortController.signal,
        },
      ),
    );

    return stream;
  }
  private async finaliseAudioStream({
    persisted,
    sessionId,
    assembledResponse,
    newTitle,
    userMessageId,
    transcriptionText,
  }: PersistStreamedMessageAndTitlePayload & {
    userMessageId: string;
    transcriptionText: string;
  }): Promise<boolean> {
    if (persisted) return true;

    await this.sessionsRepo.updateTitleAndTouch({ sessionId, newTitle });

    if (assembledResponse.length > 0) {
      await this.chatbotMessagesRepo
        .create({
          content: assembledResponse,
          role: MessageRole.ASSISTANT,
          sessionId,
          type: MessageType.TEXT,
        })
        .catch((err: unknown) => {
          logger.error('Failed to persist assistant audio reply', { err });
        });
    }

    if (transcriptionText) {
      await this.chatbotMessagesRepo
        .updateContent(userMessageId, transcriptionText)
        .catch((err: unknown) => {
          logger.error('Failed to update user audio message transcription', {
            err,
            userMessageId,
          });
        });
    }

    return true;
  }

  private async persistAssistantMessageAndUpdateSessionTitle({
    newTitle,
    persisted,
    sessionId,
    assembledResponse,
  }: PersistStreamedMessageAndTitlePayload): Promise<boolean> {
    if (persisted) return true;

    const promises: Promise<unknown>[] = [
      this.sessionsRepo.updateTitleAndTouch({ sessionId, newTitle }),
    ];

    if (assembledResponse.length > 0) {
      promises.push(
        this.chatbotMessagesRepo.create({
          content: assembledResponse,
          role: MessageRole.ASSISTANT,
          sessionId,
        }),
      );
    }

    await Promise.all(promises);
    return true;
  }

  private handleStreamErrors({
    stream,
    subscriber,
  }: HandleStreamEventsPayload) {
    stream.on('error', (err: Error) => {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;

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
