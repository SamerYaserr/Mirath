import { Injectable } from '@nestjs/common';

import { HttpResponse } from 'src/common/types/api.types';
import { ChatSessionsRepository } from './repositories/chat-sessions.repository';
import { SessionResDto } from './dto/responses/session.res.dto';

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
}
