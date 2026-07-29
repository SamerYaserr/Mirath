import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { VoteType } from '@prisma/client';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { PrismaService } from '../prisma/prisma.service';
import { CommentVoteServiceArgs } from './comments.types';
import { HttpResponse } from 'src/common/types/api.types';
import { CommentsRepository } from './repositories/comments.repository';
import { NOTIFICATION_EVENTS } from '../notifications/notification-events';
import { CommentVotesRepository } from './repositories/comment-votes.repository';

@Injectable()
export class CommentsService {
  private readonly logger = new Logger(CommentsService.name);

  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
    private commentsRepository: CommentsRepository,
    private commentVotesRepository: CommentVotesRepository,
  ) {}

  async vote({
    user,
    commentId,
    type,
  }: CommentVoteServiceArgs): Promise<HttpResponse> {
    const comment = await this.commentsRepository.findOne(commentId, user.id);
    if (!comment) throw new NotFoundException('No comment found with this ID');

    await this.prisma.$transaction(async (tx) => {
      const existingVote = await this.commentVotesRepository.findOne(
        { userId: user.id, commentId },
        tx,
      );

      if (existingVote) {
        if (existingVote.type === type)
          throw new BadRequestException(
            'You have already voted this way on this comment.',
          );

        await this.commentVotesRepository.updateVoteType(
          { userId: user.id, commentId, type },
          tx,
        );
        const isNowUp = type === VoteType.UP;
        await this.commentsRepository.updateVoteCounts(
          {
            id: commentId,
            updates: {
              upIncrement: isNowUp ? 1 : -1,
              downIncrement: isNowUp ? -1 : 1,
            },
          },
          tx,
        );
      } else {
        await this.commentVotesRepository.create(
          { userId: user.id, commentId, type },
          tx,
        );

        await this.commentsRepository.updateVoteCounts(
          {
            id: commentId,
            updates: {
              upIncrement: type === VoteType.UP ? 1 : 0,
              downIncrement: type === VoteType.DOWN ? 1 : 0,
            },
          },
          tx,
        );
      }
    });

    if (type === VoteType.UP && comment.authorId !== user.id) {
      try {
        this.eventEmitter.emit(NOTIFICATION_EVENTS.VOTE_COMMENT, {
          targetUserId: comment.authorId,
          actorUserId: user.id,
          actorName: user.fullName,
          actorPhotoUrl: user.photoUrl,
          discussionId: comment.discussionId,
          commentId,
          contentPreview: comment.content.substring(0, 100),
        });
      } catch (e) {
        this.logger.error('Failed to emit vote comment notification', e);
      }
    }

    return { message: 'Vote created successfully.' };
  }

  async deleteVote(userId: string, commentId: string): Promise<HttpResponse> {
    const vote = await this.commentVotesRepository.findOne({
      userId,
      commentId,
    });
    if (!vote)
      throw new BadRequestException('You have not voted for this comment');

    await this.prisma.$transaction(async (tx) => {
      await this.commentVotesRepository.delete({ userId, commentId }, tx);
      await this.commentsRepository.updateVoteCounts(
        {
          id: commentId,
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
}
