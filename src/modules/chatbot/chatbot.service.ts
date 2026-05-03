import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { HttpService } from '@nestjs/axios';
import { MessageRole } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

import {
  CreateMessagePayload,
  FindMessagesPayload,
  FindSessionsPayload,
  RenameChatSessionPayload,
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
    private readonly sessionRepo: ChatSessionsRepository,
    private readonly chatbotMessageRepo: ChatMessagesRepository,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  async createMessage(payload: CreateMessagePayload) {
    // Check if the session exists and belongs to the user
    const session = await this.findSessionOrThrow(
      payload.sessionId,
      payload.userId,
    );

    // Create the chatbot message
    const message = await this.chatbotMessageRepo.create({
      content: payload.content,
      role: MessageRole.USER,
      sessionId: session.id,
    });

    // Check if session had more than 1 messages
    const hasMultipleMessages =
      await this.chatbotMessageRepo.hasMultipleMessages(session.id);

    // This was is the first message in the session?? Need to update the session's title (temporarly until we have the better title generation from the model)
    if (hasMultipleMessages) {
      try {
        await this.updateTitle({
          thread_id: session.id,
          user_id: payload.userId,
          new_title: payload.content.slice(0, 60),
        });
      } catch {
        // Request failed?? No one cares, just log it and move on
        logger.warn(
          `Failed to update chat session title for session ${session.id}`,
        );
      }
    }

    return {
      data: {
        id: message.id,
        content: message.content,
        type: message.type,
        createdAt: message.createdAt,
      },
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
      this.chatbotMessageRepo.findMany({
        sessionId,
        limit,
        skip,
      }),
      this.chatbotMessageRepo.count(sessionId),
    ]);

    return {
      data: messages.map((message) => ChatbotMessageResDto.fromEntity(message)),
      size,
    };
  }

  async create(userId: string): Promise<HttpResponse> {
    const session = await this.sessionRepo.create(userId);

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
    const sessions = await this.sessionRepo.findAll(userId, limit, skip);

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
    await this.findSessionOrThrow(id, userId);
    await this.sessionRepo.deleteOne(id);

    return { message: 'Session deleted successfully.' };
  }

  // === Helpers ===
  async findSessionOrThrow(sessionId: string, userId: string) {
    const session = await this.sessionRepo.findById(sessionId);
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

  async updateTitle(payload: RenameChatSessionPayload) {
    await firstValueFrom(
      this.httpService.post<unknown, RenameChatSessionPayload>(
        `${this.configService.get('EXTERNAL_API_BASE_URL')}/rename/chat`,
        payload,
      ),
    );
  }
}
