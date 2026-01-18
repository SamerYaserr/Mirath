import { BadRequestException, Injectable } from '@nestjs/common';

import { HttpResponse } from 'src/common/types/api.types';
import { DiscussionsRepository } from './repositories/discussions.repository';
import { CreateDiscussionDto } from './dto/create-discussion.dto';

@Injectable()
export class DiscussionsService {
  constructor(private discussionsRepository: DiscussionsRepository) {}

  async create(
    dto: CreateDiscussionDto,
    userId: string,
  ): Promise<HttpResponse> {
    const { title, content, topicIds } = dto;

    const existingTopics =
      await this.discussionsRepository.findExistingTopics(topicIds);

    if (existingTopics.length !== topicIds.length) {
      const foundIds = existingTopics.map((topic) => topic.id);
      const invalidIds = topicIds.filter((id) => !foundIds.includes(id));

      throw new BadRequestException(
        `Invalid topic IDs: ${invalidIds.join(', ')}`,
      );
    }
    const discussion = await this.discussionsRepository.create(
      title,
      content,
      topicIds,
      userId,
    );

    return {
      message: 'discussion created successfully',
      data: discussion,
    };
  }
}
