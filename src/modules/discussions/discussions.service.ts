import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VoteType } from '@prisma/client';

import {
  CheckExistingType,
  CreateCommentServiceArgs,
  VoteServiceArgs,
} from './discussions.types';
import { PrismaService } from '../prisma/prisma.service';
import { HttpResponse } from 'src/common/types/api.types';
import { CreateDiscussionDto } from './dto/requests/create-discussion.req.dto';
import {
  GetDiscussionsDto,
  SortType,
} from './dto/requests/get-discussions.req.dto';
import { excludeUserSensitiveFields } from 'src/common/utils/user.utils';
import { UsersRepository } from '../users/repositories/users.repository';
import { PapersRepository } from '../papers/repositories/papers.repository';
import { DiscussionsRepository } from './repositories/discussions.repository';
import { CommentsRepository } from '../comments/repositories/comments.repository';
import { InterestsRepository } from '../interests/repositories/interests.repository';
import { DiscussionVotesRepository } from './repositories/discussion-votes.repository';
import { DiscussionResDto } from './dto/responses/discussion.res.dto';

@Injectable()
export class DiscussionsService {
  constructor(
    private prisma: PrismaService,
    private usersRepository: UsersRepository,
    private papersRepository: PapersRepository,
    private commentsRepository: CommentsRepository,
    private interestsRepository: InterestsRepository,
    private discussionsRepository: DiscussionsRepository,
    private discussionVotesRepository: DiscussionVotesRepository,
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

    const discussion = await this.discussionsRepository.create({
      title,
      content,
      topicIds,
      paperIds,
      authorId: userId,
    });

    return {
      message: 'discussion created successfully',
      data: DiscussionResDto.fromEntity(discussion),
    };
  }

  async findMany(q: GetDiscussionsDto, userId: string): Promise<HttpResponse> {
    const { sort = SortType.NEW, page = 1, limit = 10, topicId, authorId } = q;
    const skip = (page - 1) * limit;

    await Promise.all([
      topicId ? this.checkExisting([topicId]) : Promise.resolve(),
      authorId ? this.checkExisting([authorId], 'users') : Promise.resolve(),
    ]);

    const discussions = await this.discussionsRepository.findMany({
      userId,
      sort,
      skip,
      limit,
      topicId,
      authorId,
    });

    const transformedDiscussions = discussions.map((d) => {
      return DiscussionResDto.fromEntity(d);
    });

    return {
      message: 'Discussions retrieved successfully',
      size: transformedDiscussions.length,
      data: transformedDiscussions,
    };
  }

  async findOne(id: string, userId: string): Promise<HttpResponse> {
    const discussion = await this.discussionsRepository.findOne(id, userId);
    if (!discussion)
      throw new NotFoundException('No discussion found with this ID');

    return {
      message: 'Discussion retrieved successfully',
      data: DiscussionResDto.fromEntity(discussion),
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

  async vote({
    discussionId,
    userId,
    type,
  }: VoteServiceArgs): Promise<HttpResponse> {
    const discussion = await this.discussionsRepository.findOne(
      discussionId,
      userId,
    );
    if (!discussion)
      throw new NotFoundException('No discussion found with this ID');

    await this.prisma.$transaction(async (tx) => {
      const existingVote = await this.discussionVotesRepository.findOne(
        { userId, discussionId },
        tx,
      );

      if (existingVote) {
        if (existingVote.type === type)
          throw new BadRequestException(
            'You have already voted this way on this discussion.',
          );

        await this.discussionVotesRepository.updateVoteType(
          { userId, discussionId, type },
          tx,
        );

        const isNowUp = type === VoteType.UP;
        await this.discussionsRepository.updateVoteCounts(
          {
            id: discussionId,
            updates: {
              upIncrement: isNowUp ? 1 : -1,
              downIncrement: isNowUp ? -1 : 1,
            },
          },
          tx,
        );
      } else {
        await this.discussionVotesRepository.create(
          { userId, discussionId, type },
          tx,
        );

        await this.discussionsRepository.updateVoteCounts(
          {
            id: discussionId,
            updates: {
              upIncrement: type === VoteType.UP ? 1 : 0,
              downIncrement: type === VoteType.DOWN ? 1 : 0,
            },
          },
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
    const vote = await this.discussionVotesRepository.findOne({
      userId,
      discussionId,
    });
    if (!vote)
      throw new BadRequestException('You have not voted for this discussion');

    await this.prisma.$transaction(async (tx) => {
      await this.discussionVotesRepository.delete({ userId, discussionId }, tx);

      await this.discussionsRepository.updateVoteCounts(
        {
          id: discussionId,
          updates: {
            upIncrement: vote.type === VoteType.UP ? -1 : 0,
            downIncrement: vote.type === VoteType.DOWN ? -1 : 0,
          },
        },
        tx,
      );
    });

    return { message: 'Vote deleted successfully.' };
  }

  async createComment({
    dto,
    discussionId,
    userId,
  }: CreateCommentServiceArgs): Promise<HttpResponse> {
    const { content, parentId = undefined } = dto;

    const discussion = await this.discussionsRepository.findOne(
      discussionId,
      userId,
    );
    if (!discussion)
      throw new NotFoundException('No discussion found with this ID');

    if (parentId) {
      const parentComment = await this.commentsRepository.findById(parentId);

      if (!parentComment)
        throw new NotFoundException('Parent comment not found');

      if (parentComment.discussionId !== discussionId)
        throw new BadRequestException(
          'Parent comment does not belong to this discussion',
        );
    }

    const comment = await this.prisma.$transaction(async (tx) => {
      const newComment = await this.commentsRepository.create(
        {
          discussionId,
          authorId: userId,
          content,
          parentId: parentId ?? null,
        },
        tx,
      );

      await this.discussionsRepository.updateCommentCount(
        { id: discussionId, increment: 1 },
        tx,
      );
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

    const comments = await this.commentsRepository.findDiscussionComments(
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
      message: 'Comments retrieved successfully',
      size: transformedComment.length,
      data: transformedComment,
    };
  }

  // --- helpers ---
  async checkExisting(ids: string[], type: CheckExistingType = 'topic') {
    let existing;

    switch (type) {
      case 'paper':
        existing = await this.papersRepository.findByIds(ids);
        break;
      case 'users':
        existing = await this.usersRepository.findByIds(ids);
        break;
      default:
        existing = await this.interestsRepository.findByIds(ids);
    }

    if (existing.length !== ids.length) {
      const foundIds = existing.map((f) => f.id);
      const invalidIds = ids.filter((id) => !foundIds.includes(id));

      throw new BadRequestException(
        `Invalid ${type} ID(s): ${invalidIds.join(', ')}`,
      );
    }
  }
}
