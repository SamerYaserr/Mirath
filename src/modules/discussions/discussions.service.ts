import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { HttpResponse } from 'src/common/types/api.types';
import {
  DiscussionsRepository,
  DiscussionWithRelations,
} from './repositories/discussions.repository';
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import { GetDiscussionsDto, SortType } from './dto/get-discussions.dto';
import { excludeUserSensitiveFields } from 'src/common/utils/user.utils';

@Injectable()
export class DiscussionsService {
  constructor(private discussionsRepository: DiscussionsRepository) {}

  async create(
    dto: CreateDiscussionDto,
    userId: string,
  ): Promise<HttpResponse> {
    const { title, content, topicIds, paperIds } = dto;
    await Promise.all([
      this.checkExisting(topicIds),
      this.checkExisting(paperIds, 'paper'),
    ]);

    const discussion = await this.discussionsRepository.create(
      title,
      content,
      topicIds,
      paperIds,
      userId,
    );
    const transformedDiscussions = this.transformDiscussion(discussion);

    return {
      message: 'discussion created successfully',
      data: transformedDiscussions,
    };
  }

  async findAll(q: GetDiscussionsDto, userId: string): Promise<HttpResponse> {
    const { sort = SortType.NEW, page = 1, limit = 10, topicId } = q;
    const skip = (page - 1) * limit;
    if (topicId) await this.checkExisting([topicId]);

    const discussions = await this.discussionsRepository.findAll(
      userId,
      sort,
      skip,
      limit,
      topicId,
    );
    const transformedDiscussions = discussions.map((discussion) => {
      return this.transformDiscussion(discussion);
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

    const transformedDiscussions = this.transformDiscussion(discussion);

    return {
      data: transformedDiscussions,
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

  // --- helpers ---
  async checkExisting(ids: string[], type: string = 'topic') {
    let existing;
    if (type === 'paper')
      existing = await this.discussionsRepository.findExistingPapers(ids);
    else existing = await this.discussionsRepository.findExistingTopics(ids);

    if (existing.length !== ids.length) {
      const foundIds = existing.map((f) => f.id);
      const invalidIds = ids.filter((id) => !foundIds.includes(id));

      throw new BadRequestException(
        `Invalid ${type} ID(s): ${invalidIds.join(', ')}`,
      );
    }
  }

  private transformDiscussion(discussion: DiscussionWithRelations) {
    const userVote = discussion!.votes[0];
    const { votes, ...rest } = discussion!;

    return {
      ...rest,
      hasVoted: !!userVote,
      userVoteType: userVote?.type || undefined,
      topics: discussion!.topics.map((t) => t.interest),
      author: excludeUserSensitiveFields(discussion!.author),
    };
  }
}
