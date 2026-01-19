import {
  BadRequestException,
  ForbiddenException,
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
      const { votes, ...rest } = discussion;

      return {
        ...rest,
        hasVoted: !!userVote,
        userVoteType: userVote?.type || undefined,
        topics: discussion.topics.map((t) => t.interest),
      };
    });

    return {
      size: transformedDiscussions.length,
      data: transformedDiscussions,
    };
  }

  async findOne(id: string, userId: string): Promise<HttpResponse> {
    const discussion = await this.discussionsRepository.findOne(id, userId);
    if (!discussion)
      throw new NotFoundException('No discussion found with this ID');

    const userVote = discussion.votes[0];
    const { votes, ...rest } = discussion;

    return {
      data: {
        ...rest,
        topics: discussion.topics.map((t) => t.interest),
        hasVoted: !!userVote,
        userVoteType: userVote?.type || undefined,
      },
    };
  }

  async deleteOne(discussionId: string, userId: string): Promise<HttpResponse> {
    const discussion = await this.discussionsRepository.findOne(
      discussionId,
      userId,
    );
    if (!discussion)
      throw new NotFoundException('No discussion found with this ID');
    if (discussion.authorId !== userId)
      throw new ForbiddenException(
        'You are only allowed to delete your discussions',
      );

    await this.discussionsRepository.deleteOne(discussionId);

    return { message: 'Discussion deleted successfully.' };
  }
}
