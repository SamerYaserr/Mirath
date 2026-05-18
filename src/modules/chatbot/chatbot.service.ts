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
  EXT_TO_MIME,
  ExternalApiStreamResponse,
  FindMessagesPayload,
  FindSessionsPayload,
  PersistStreamedMessageAndTitlePayload,
  ProcessAudioStreamPayload,
  ProcessImageStreamPayload,
  ProcessStreamPayload,
  RenameChatSessionExternalApiPayload,
  RenameChatSessionPayload,
  CallExternalChatStreamParams,
} from './chatbot.types';
import { AppConfig } from 'src/config/configuration';
import { HttpResponse } from 'src/common/types/api.types';
import { SessionResDto } from './dto/responses/session.res.dto';
import { winstonLogger as logger } from 'src/config/logger.config';
import ChatSessionsRepository from './repositories/sessions.repository';
import ChatMessagesRepository from './repositories/messages.repository';
import ChatFilesRepository from './repositories/chat-files.repository';
import { CloudinaryService } from '../cloudinary/cloudinary.service';
import { ChatbotMessageResDto } from './dto/responses/chatbot-message.res.dto';
import { GetUserSessionsResDto } from './dto/responses/get-user-sessions.res.dto';
import { SubmitFeedbackResDto } from './dto/responses/submit-feedback.res.dto';
import { PrismaService } from '../prisma/prisma.service';
import MessageFeedbacksRepository from './repositories/message-feedbacks.repository';
import { TemporarySessionResDto } from './dto/responses/temporary-session.res.dto';
import { ChatFileResDto } from './dto/responses/chat-file.res.dto';
import { UploadChatFileReqDto } from './dto/requests/upload-chat-file.req.dto';
import { FeedbackType } from '@prisma/client';

@Injectable()
export default class ChatbotService {
  constructor(
    private readonly httpService: HttpService,
    private readonly sessionsRepo: ChatSessionsRepository,
    private readonly chatbotMessagesRepo: ChatMessagesRepository,
    private readonly chatFilesRepo: ChatFilesRepository,
    private readonly messageFeedbacksRepo: MessageFeedbacksRepository,
    private readonly configService: ConfigService<AppConfig, true>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly prisma: PrismaService,
  ) {}

  async uploadFile(
    userId: string,
    file: Express.Multer.File,
    dto: UploadChatFileReqDto,
  ): Promise<HttpResponse<ChatFileResDto>> {
    const isAudio = dto.type === AttachmentType.AUDIO;

    const { secure_url } = await this.cloudinaryService.uploadFile(
      file,
      isAudio ? 'mirath/chatbot/audio' : 'mirath/chatbot',
      isAudio ? 'video' : 'auto',
    );

    const chatFile = await this.chatFilesRepo.create({
      userId,
      type: dto.type,
      url: secure_url,
      mimeType: file.mimetype,
      sizeBytes: file.size,
      durationSeconds: dto.durationSeconds ?? null,
    });

    return { data: ChatFileResDto.fromEntity(chatFile) };
  }

  async processStream({
    userId,
    sessionId,
    content,
    fileId,
    abortController,
    subscriber,
  }: ProcessStreamPayload): Promise<void> {
    if (!content && !fileId) {
      subscriber.error(
        new BadRequestException('Please provide a message or attach a file.'),
      );
      return;
    }

    if (!fileId) {
      return this.processTextStream({
        userId,
        sessionId,
        content: content!,
        abortController,
        subscriber,
      });
    }

    // Validate ownership in the same query — no extra round-trip.
    const chatFile = await this.chatFilesRepo.findByIdAndUser(fileId, userId);
    if (!chatFile) {
      subscriber.error(new NotFoundException('File not found.'));
      return;
    }

    if (chatFile.type === AttachmentType.AUDIO) {
      return this.processAudioStream({
        userId,
        sessionId,
        chatFile,
        abortController,
        subscriber,
      });
    }

    return this.processImageStream({
      userId,
      sessionId,
      content: content ?? '',
      chatFile,
      abortController,
      subscriber,
    });
  }

  private async processTextStream({
    userId,
    content,
    sessionId,
    subscriber,
    abortController,
  }: Omit<ProcessStreamPayload, 'fileId'> & {
    content: string;
  }): Promise<void> {
    try {
      const session = await this.findSessionOrThrow(sessionId, userId);
      if (session.isTemporary) await this.sessionsRepo.extendExpiry(sessionId);

      await this.chatbotMessagesRepo.create({
        content,
        role: MessageRole.USER,
        sessionId,
      });

      const hasMultiple =
        await this.chatbotMessagesRepo.hasMultipleMessages(sessionId);
      if (!session.isTemporary && !hasMultiple) {
        await this.updateTitle({
          sessionId,
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

      this.driveStream({
        stream,
        subscriber,
        sessionId,
        isTemporary: session.isTemporary,
        onEnd: async (assembledResponse, newTitle, persisted) => {
          await this.persistAssistantMessage({
            assembledResponse,
            newTitle,
            persisted,
            sessionId,
            isTemporary: session.isTemporary,
          });
        },
      });
    } catch (error) {
      this.handleError(error, subscriber);
    }
  }

  private async processImageStream({
    userId,
    sessionId,
    content,
    chatFile,
    abortController,
    subscriber,
  }: ProcessImageStreamPayload): Promise<void> {
    try {
      const session = await this.findSessionOrThrow(sessionId, userId);
      if (session.isTemporary) await this.sessionsRepo.extendExpiry(sessionId);

      await this.chatbotMessagesRepo.createWithAttachment(
        { sessionId, role: MessageRole.USER, type: MessageType.IMAGE, content },
        {
          type: AttachmentType.IMAGE,
          url: chatFile.url,
          mimeType: chatFile.mimeType,
          sizeBytes: chatFile.sizeBytes,
        },
      );

      this.chatFilesRepo.deleteOne(chatFile.id).catch((err: unknown) =>
        logger.error(
          'Failed to delete staging ChatFile after MessageAttachment created',
          {
            err,
            chatFileId: chatFile.id,
          },
        ),
      );

      const hasMultiple =
        await this.chatbotMessagesRepo.hasMultipleMessages(sessionId);
      if (!session.isTemporary && !hasMultiple) {
        await this.updateTitle({
          sessionId,
          userId,
          newTitle: content ? content.slice(0, 60) : 'Image message',
        });
      }

      const stream = await this.callExternalChatStream({
        content,
        imageUrl: chatFile.url,
        imageMimeType: chatFile.mimeType,
        abortController,
        userId,
        sessionId,
      });

      this.driveStream({
        stream,
        subscriber,
        sessionId,
        isTemporary: session.isTemporary,
        onEnd: async (assembledResponse, newTitle, persisted) => {
          const { messageId } = await this.persistAssistantImageMessage({
            assembledResponse,
            newTitle,
            persisted,
            sessionId,
            isTemporary: session.isTemporary,
          });
          if (messageId) {
            await this.persistAiImageAttachments(
              messageId,
              assembledResponse,
            ).catch((err: unknown) =>
              logger.error('Failed to persist AI image attachments', { err }),
            );
          }
        },
      });
    } catch (error) {
      this.handleError(error, subscriber);
    }
  }

  private async processAudioStream({
    userId,
    sessionId,
    chatFile,
    abortController,
    subscriber,
  }: ProcessAudioStreamPayload): Promise<void> {
    try {
      const session = await this.findSessionOrThrow(sessionId, userId);
      if (session.isTemporary) await this.sessionsRepo.extendExpiry(sessionId);

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
            url: chatFile.url,
            mimeType: chatFile.mimeType,
            sizeBytes: chatFile.sizeBytes,
            durationSeconds: chatFile.durationSeconds,
          },
        );

      this.chatFilesRepo.deleteOne(chatFile.id).catch((err: unknown) =>
        logger.error(
          'Failed to delete staging ChatFile after audio MessageAttachment created',
          {
            err,
            chatFileId: chatFile.id,
          },
        ),
      );

      const hasMultiple =
        await this.chatbotMessagesRepo.hasMultipleMessages(sessionId);
      if (!session.isTemporary && !hasMultiple) {
        await this.updateTitle({
          sessionId,
          userId,
          newTitle: 'Voice message',
        });
      }

      const stream = await this.callExternalChatStream({
        content: '',
        audioUrl: chatFile.url,
        audioMimeType: chatFile.mimeType,
        abortController,
        userId,
        sessionId,
      });

      let buffer = '';
      let assembledResponse = '';
      let transcriptionText = '';
      let transcriptionEmitted = false;
      let persisted = false;
      let newTitle: string | undefined;

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
            const event = JSON.parse(jsonStr) as
              | ExternalApiStreamResponse
              | { type: 'transcription'; transcription: string };

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

              case 'model_answer':
                if (event.content) {
                  assembledResponse = event.content;
                  subscriber.next({ data: { delta: event.content } });
                }
                break;

              case 'status':
                subscriber.next({ data: { status: event.content ?? '' } });
                break;

              case 'chat_title':
                newTitle = event.content;
                break;

              case 'end':
                this.finaliseAudioStream({
                  persisted,
                  sessionId,
                  assembledResponse,
                  newTitle,
                  isTemporary: session.isTemporary,
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
                    error:
                      event.content ??
                      'AI service failed to process the voice message.',
                  },
                });
                subscriber.complete();
                break;
            }
          } catch {
            // Malformed JSON line — skip silently.
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
            isTemporary: session.isTemporary,
            userMessageId: userMessage.id,
            transcriptionText,
          }).catch((err: unknown) =>
            logger.error('Persist fallback failed on audio stream end', {
              err,
            }),
          );
        }
      });

      stream.on('error', (err: Error) => {
        if (err.name === 'CanceledError' || err.name === 'AbortError') return;
        logger.error('AI audio stream transport error', { error: err });
        subscriber.next({
          data: {
            error:
              'Failed to process the voice message, please try again later.',
          },
        });
        subscriber.complete();
      });
    } catch (error) {
      this.handleError(error, subscriber);
    }
  }

  private driveStream({
    stream,
    subscriber,
    sessionId,
    isTemporary,
    onEnd,
  }: {
    stream: Readable;
    subscriber: ProcessStreamPayload['subscriber'];
    sessionId: string;
    isTemporary: boolean;
    onEnd: (
      assembledResponse: string,
      newTitle: string | undefined,
      persisted: boolean,
    ) => Promise<void>;
  }): void {
    let buffer = '';
    let assembledResponse = '';
    let newTitle: string | undefined;
    let persisted = false;

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
            case 'model_answer':
              if (event.content) {
                assembledResponse = event.content;
                subscriber.next({ data: { delta: event.content } });
              }
              break;

            case 'status':
              subscriber.next({ data: { status: event.content ?? '' } });
              break;

            case 'chat_title':
              newTitle = event.content;
              break;

            case 'end':
              onEnd(assembledResponse, newTitle, persisted)
                .then(() => {
                  persisted = true;
                  subscriber.next({ data: '[DONE]' });
                  subscriber.complete();
                })
                .catch((err: unknown) => {
                  logger.error(
                    'Failed to persist assistant message on end event',
                    { err },
                  );
                  subscriber.next({ data: '[DONE]' });
                  subscriber.complete();
                });
              break;

            case 'error':
              subscriber.next({
                data: {
                  error:
                    event.content ??
                    'Failed to process the message, please try again later.',
                },
              });
              subscriber.complete();
              break;
          }
        } catch {
          // Malformed JSON line — skip silently.
        }
      }
    });

    stream.on('end', () => {
      if (!persisted && assembledResponse.length > 0) {
        onEnd(assembledResponse, newTitle, persisted).catch((err: unknown) =>
          logger.error('Persist fallback failed on stream end', { err }),
        );
      }
    });

    stream.on('error', (err: Error) => {
      if (err.name === 'CanceledError' || err.name === 'AbortError') return;
      logger.error('AI stream transport error', { error: err });
      subscriber.next({
        data: {
          error: 'Failed to process the message, please try again later.',
        },
      });
      subscriber.complete();
    });
  }

  async submitFeedback({
    userId,
    sessionId,
    messageId,
    feedbackType,
  }: {
    userId: string;
    sessionId: string;
    messageId: string;
    feedbackType: FeedbackType;
  }): Promise<HttpResponse> {
    await this.findSessionOrThrow(sessionId, userId);
    const message = await this.findMessageOrThrow(messageId, sessionId);

    if (message.role !== 'ASSISTANT') {
      throw new BadRequestException('You can only rate AI responses');
    }

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
      data: messages.map((m) => ChatbotMessageResDto.fromEntity(m)),
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

  async createTemporary(userId: string): Promise<HttpResponse> {
    const session = await this.sessionsRepo.createTemporary(userId);
    return { data: TemporarySessionResDto.fromEntity(session) };
  }

  async deleteTemporary(id: string, userId: string): Promise<void> {
    const session = await this.sessionsRepo.findById(id);
    if (!session) throw new NotFoundException('Chat session not found');
    if (session.userId !== userId)
      throw new ForbiddenException(
        'You do not have permission to delete this chat session',
      );
    if (!session.isTemporary) {
      throw new BadRequestException(
        'This endpoint only accepts temporary sessions. Use DELETE /chatbot/sessions/:id to delete a regular session.',
      );
    }
    await this.deleteTemporarySessionFromExternalApi(id);
    await this.sessionsRepo.deleteOne(id);
  }

  async findAll({
    userId,
    limit,
    skip,
  }: FindSessionsPayload): Promise<HttpResponse> {
    const sessions = await this.sessionsRepo.findAll(userId, limit, skip);
    return {
      size: sessions.length,
      data: sessions.map((s) => GetUserSessionsResDto.fromEntity(s)),
    };
  }

  async findOne(id: string, userId: string): Promise<HttpResponse> {
    const session = await this.findSessionOrThrow(id, userId);
    return { data: SessionResDto.fromEntity(session) };
  }

  async deleteOne(id: string, userId: string): Promise<HttpResponse> {
    const session = await this.findSessionOrThrow(id, userId);
    if (session.isTemporary)
      await this.deleteTemporarySessionFromExternalApi(id);
    await this.sessionsRepo.deleteOne(id);
    return { message: 'Session deleted successfully.' };
  }

  private async findSessionOrThrow(sessionId: string, userId: string) {
    const session = await this.sessionsRepo.findById(sessionId);
    if (!session) throw new NotFoundException('Chat session not found');
    if (session.userId !== userId)
      throw new ForbiddenException(
        'You do not have access to this chat session',
      );
    return session;
  }

  private async findMessageOrThrow(messageId: string, sessionId: string) {
    const message = await this.chatbotMessagesRepo.findOne(messageId);
    if (!message) throw new NotFoundException('Message not found');
    if (message.sessionId !== sessionId)
      throw new ForbiddenException('Message does not belong to this session');
    return message;
  }

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
      ).catch((error) =>
        logger.error(`Failed to sync title for session ${sessionId}`, {
          error,
        }),
      ),
    ]);
  }

  private async deleteTemporarySessionFromExternalApi(sessionId: string) {
    await firstValueFrom(
      this.httpService.delete(
        `${this.configService.get('EXTERNAL_API_BASE_URL')}/temporary/chat`,
        { data: { thread_id: sessionId } },
      ),
    ).catch((error) =>
      logger.error(
        `Failed to delete temporary session ${sessionId} via external API`,
        { error },
      ),
    );
  }

  private async callExternalChatStream({
    userId,
    content,
    sessionId,
    imageUrl,
    imageMimeType,
    audioUrl,
    audioMimeType,
    abortController,
  }: CallExternalChatStreamParams): Promise<Readable> {
    const form = new FormData();
    if (content) form.append('message', content);

    if (imageUrl) {
      const fileBuffer = await this.fetchFileBuffer(imageUrl, abortController);
      form.append('image', fileBuffer, {
        filename: 'image',
        contentType: imageMimeType ?? 'image/jpeg',
      });
    }

    if (audioUrl) {
      const fileBuffer = await this.fetchFileBuffer(audioUrl, abortController);
      form.append('voice', fileBuffer, {
        filename: 'audio',
        contentType: audioMimeType ?? 'audio/wav',
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

  // Fetches a file from a remote URL and returns its content as a Buffer.
  // Used to forward Cloudinary-hosted files to the AI service as binary.
  private async fetchFileBuffer(
    url: string,
    abortController: AbortController,
  ): Promise<Buffer> {
    const { data } = await firstValueFrom(
      this.httpService.get<ArrayBuffer>(url, {
        responseType: 'arraybuffer',
        signal: abortController.signal,
      }),
    );
    return Buffer.from(data);
  }

  private async persistAssistantMessage({
    newTitle,
    persisted,
    sessionId,
    assembledResponse,
    isTemporary,
  }: PersistStreamedMessageAndTitlePayload): Promise<boolean> {
    if (persisted) return true;

    const promises: Promise<unknown>[] = [
      this.sessionsRepo.updateTitleAndTouch({
        sessionId,
        newTitle: isTemporary ? undefined : newTitle,
      }),
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

  private async persistAssistantImageMessage({
    persisted,
    sessionId,
    assembledResponse,
    newTitle,
    isTemporary,
  }: PersistStreamedMessageAndTitlePayload): Promise<{
    persisted: boolean;
    messageId: string | undefined;
  }> {
    if (persisted) return { persisted: true, messageId: undefined };

    await this.sessionsRepo.updateTitleAndTouch({
      sessionId,
      newTitle: isTemporary ? undefined : newTitle,
    });

    if (assembledResponse.length === 0)
      return { persisted: true, messageId: undefined };

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
    const urls = text.match(
      /https?:\/\/[^\s"'<>)]+\.(?:jpg|jpeg|png|webp|gif)/gi,
    );
    if (!urls?.length) return;

    await Promise.all(
      [...new Set(urls)].map((url) => {
        const ext = url.split('.').pop()?.toLowerCase() ?? '';
        return this.chatbotMessagesRepo.createAttachment(messageId, {
          type: AttachmentType.IMAGE,
          url,
          mimeType: EXT_TO_MIME[ext] ?? 'image/jpeg',
          sizeBytes: 0,
        });
      }),
    );
  }

  private async finaliseAudioStream({
    persisted,
    sessionId,
    assembledResponse,
    newTitle,
    isTemporary,
    userMessageId,
    transcriptionText,
  }: PersistStreamedMessageAndTitlePayload & {
    userMessageId: string;
    transcriptionText: string;
  }): Promise<boolean> {
    if (persisted) return true;

    await this.sessionsRepo.updateTitleAndTouch({
      sessionId,
      newTitle: isTemporary ? undefined : newTitle,
    });

    if (assembledResponse.length > 0) {
      await this.chatbotMessagesRepo
        .create({
          content: assembledResponse,
          role: MessageRole.ASSISTANT,
          sessionId,
        })
        .catch((err: unknown) =>
          logger.error('Failed to persist assistant audio reply', { err }),
        );
    }

    if (transcriptionText) {
      await this.chatbotMessagesRepo
        .updateContent(userMessageId, transcriptionText)
        .catch((err: unknown) =>
          logger.error('Failed to update audio message transcription', { err }),
        );
    }

    return true;
  }

  private handleError(
    error: unknown,
    subscriber: Pick<
      ProcessStreamPayload['subscriber'],
      'error' | 'next' | 'complete'
    >,
  ) {
    if (
      error instanceof NotFoundException ||
      error instanceof ForbiddenException ||
      error instanceof BadGatewayException
    ) {
      subscriber.error(error);
    } else {
      logger.error('Unhandled stream processor error', { error });
      subscriber.next({
        data: {
          error: 'An unexpected error occurred. Please try again later.',
        },
      });
      subscriber.complete();
    }
  }
}
