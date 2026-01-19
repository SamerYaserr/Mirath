import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { HttpResponse } from 'src/common/types/api.types';
import { DiscussionsRepository } from './repositories/discussions.repository';
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import { GetDiscussionsDto, SortType } from './dto/get-discussions.dto';

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

  async findAll(q: GetDiscussionsDto, userId: string): Promise<HttpResponse> {
    const { sort = SortType.NEW, page = 1, limit = 10, topicId } = q;
    const skip = (page - 1) * limit;
    if (topicId) {
      const existingTopic = await this.discussionsRepository.findExistingTopics(
        [topicId],
      );
      if (!existingTopic.length)
        throw new BadRequestException(`Invalid topic ID`);
    }
    const discussions = await this.discussionsRepository.findAll(
      userId,
      sort,
      skip,
      limit,
      topicId,
    );
    const transformedDiscussions = discussions.map((discussion) => {
      const userVote = discussion.votes[0];

      return {
        ...discussion,
        hasVoted: !!userVote,
        userVoteType: userVote?.type || undefined,
        topics: discussion.topics.map((t) => t.interest),
        votes: undefined,
      };
    });

    return {
      size: transformedDiscussions.length,
      data: transformedDiscussions,
    };
  }

  async findOne(id: string): Promise<HttpResponse> {
    const discussion = await this.discussionsRepository.findOne(id);
    if (!discussion)
      throw new NotFoundException('No discussion found with this ID');

    return { data: discussion };
  }
}
