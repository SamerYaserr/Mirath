import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { HttpResponse } from 'src/common/types/api.types';
import { SessionResDto } from './dto/responses/session.res.dto';
import { ChatSessionsRepository } from './repositories/chat-sessions.repository';
import { GetUserSessionsResDto } from './dto/responses/get-user-sessions.res.dto';

@Injectable()
export class ChatbotService {
  constructor(private chatSessionsRepository: ChatSessionsRepository) {}

  async create(userId: string): Promise<HttpResponse> {
    const session = await this.chatSessionsRepository.create(userId);

    return {
      message: 'session created successfully',
      data: SessionResDto.fromEntity(session),
    };
  }

  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<HttpResponse> {
    const skip = (page - 1) * limit;
    const sessions = await this.chatSessionsRepository.findAll(
      userId,
      limit,
      skip,
    );

    return {
      size: sessions.length,
      data: sessions.map((session) =>
        GetUserSessionsResDto.fromEntity(session),
      ),
    };
  }

  async findOne(id: string, userId: string): Promise<HttpResponse> {
    const session = await this.chatSessionsRepository.findOne(id);
    if (!session) throw new NotFoundException('No session found with this id.');

    if (session.userId !== userId)
      throw new ForbiddenException(
        'You do not have permission to access this chat session.',
      );

    return { data: SessionResDto.fromEntity(session) };
  }

  async deleteOne(id: string, userId: string): Promise<HttpResponse> {
    const session = await this.chatSessionsRepository.findOne(id);
    if (!session) throw new NotFoundException('No session found with this id.');

    if (session.userId !== userId)
      throw new ForbiddenException(
        'You do not have permission to delete this chat session.',
      );

    await this.chatSessionsRepository.deleteOne(id);

    return { message: 'Session deleted successfully.' };
  }
}
