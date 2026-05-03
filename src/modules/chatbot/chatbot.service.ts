import { Injectable } from '@nestjs/common';

import { HttpResponse } from 'src/common/types/api.types';
import { ChatSessionsRepository } from './repositories/chat-sessions.repository';
import { CreateSessionResDto } from './dto/responses/create-session.res.dto';
import { GetUserSessionsResDto } from './dto/responses/get-user-sessions.res.dto';

@Injectable()
export class ChatbotService {
  constructor(private chatSessionsRepository: ChatSessionsRepository) {}

  async create(userId: string): Promise<HttpResponse> {
    const session = await this.chatSessionsRepository.create(userId);

    return {
      message: 'session created successfully',
      data: CreateSessionResDto.fromEntity(session),
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
      data: sessions.map((session) =>
        GetUserSessionsResDto.fromEntity(session),
      ),
    };
  }
}
