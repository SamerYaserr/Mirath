import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VoteType } from '@prisma/client';

import {
  DiscussionsRepository,
  DiscussionWithRelations,
} from './repositories/discussions.repository';
import { PrismaService } from '../prisma/prisma.service';
import { HttpResponse } from 'src/common/types/api.types';
import { CreateDiscussionDto } from './dtos/create-discussion.dto';
import { GetDiscussionsDto, SortType } from './dtos/get-discussions.dto';
import { excludeUserSensitiveFields } from 'src/common/utils/user.utils';
import { CreateCommentDto } from './dtos/create-comment.dto';

@Injectable()
export class DiscussionsService {
  constructor(
    private discussionsRepository: DiscussionsRepository,
    private prisma: PrismaService,
  ) {}

  async create(
    dto: CreateDiscussionDto,
    userId: string,
  ): Promise<HttpResponse> {
    const { title, content, topicIds, paperIds = [] } = dto;
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

  async vote(
    discussionId: string,
    userId: string,
    type: VoteType,
  ): Promise<HttpResponse> {
    const discussion = await this.discussionsRepository.findOne(
      discussionId,
      userId,
    );
    if (!discussion)
      throw new NotFoundException('No discussion found with this ID');

    await this.prisma.$transaction(async (tx) => {
      const existingVote = await this.discussionsRepository.findVote(
        userId,
        discussionId,
        tx,
      );

      if (existingVote) {
        if (existingVote.type === type)
          throw new BadRequestException(
            'You have already voted this way on this discussion.',
          );

        await this.discussionsRepository.updateVoteType(
          userId,
          discussionId,
          type,
          tx,
        );
        await this.discussionsRepository.updateVoteScore(
          discussionId,
          type === VoteType.UP ? 2 : -2,
          tx,
        );
      } else {
        await this.discussionsRepository.createVote(
          userId,
          discussionId,
          type,
          tx,
        );
        await this.discussionsRepository.updateVoteScore(
          discussionId,
          type === VoteType.UP ? 1 : -1,
          tx,
        );
      }
    });

    return { message: 'Vote created successfully.' };
  }

  async deleteVote(
    discussionId: string,
    userId: string,
  ): Promise<HttpResponse> {
    const vote = await this.discussionsRepository.findVote(
      userId,
      discussionId,
    );
    if (!vote)
      throw new BadRequestException('You have not voted for this discussion');

    await this.prisma.$transaction(async (tx) => {
      await this.discussionsRepository.deleteVote(userId, discussionId, tx);
      await this.discussionsRepository.updateVoteScore(
        discussionId,
        vote.type === VoteType.UP ? -1 : 1,
        tx,
      );
    });

    return { message: 'Vote deleted successfully.' };
  }

  async createComment(
    userId: string,
    discussionId: string,
    dto: CreateCommentDto,
  ): Promise<HttpResponse> {
    const { content, parentId = undefined } = dto;
    const discussion = await this.discussionsRepository.findOne(
      discussionId,
      userId,
    );
    if (!discussion)
      throw new NotFoundException('No discussion found with this ID');

    if (parentId) {
      const parentComment =
        await this.discussionsRepository.findComment(parentId);
      if (!parentComment)
        throw new NotFoundException('Parent comment not found');
      if (parentComment.discussionId !== discussionId)
        throw new BadRequestException(
          'Parent comment does not belong to this discussion',
        );
    }

    const comment = await this.prisma.$transaction(async (tx) => {
      const newComment = await this.discussionsRepository.createComment(
        discussionId,
        userId,
        content,
        parentId,
        tx,
      );
      await this.discussionsRepository.updateCommentCount(discussionId, 1, tx);
      return newComment;
    });

    return { message: 'Comment posted successfully.', data: comment };
  }

  async getDiscussionComments(
    userId: string,
    discussionId: string,
  ): Promise<HttpResponse> {
    const discussion = await this.discussionsRepository.findOne(
      discussionId,
      userId,
    );
    if (!discussion)
      throw new NotFoundException('No discussion found with this ID');

    const comments = await this.discussionsRepository.findDiscussionComments(
      userId,
      discussionId,
    );

    const transformedComment = comments.map((comment) => {
      const userVote = comment!.votes[0];
      const { votes, ...rest } = comment!;

      return {
        ...rest,
        hasVoted: !!userVote,
        userVoteType: userVote?.type || undefined,
        author: excludeUserSensitiveFields(comment!.author),
      };
    });

    return {
      size: transformedComment.length,
      data: transformedComment,
    };
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
