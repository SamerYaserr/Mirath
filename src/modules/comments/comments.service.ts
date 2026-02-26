import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { VoteType } from '@prisma/client';

import { PrismaService } from '../prisma/prisma.service';
import { HttpResponse } from 'src/common/types/api.types';
import { CommentsRepository } from './repositories/comments.repository';

@Injectable()
export class CommentsService {
  constructor(
    private commentsRepository: CommentsRepository,
    private prisma: PrismaService,
  ) {}

  async vote(
    userId: string,
    commentId: string,
    type: VoteType,
  ): Promise<HttpResponse> {
    const comment = await this.commentsRepository.findOne(commentId, userId);
    if (!comment) throw new NotFoundException('No comment found with this ID');

    await this.prisma.$transaction(async (tx) => {
      const existingVote = await this.commentsRepository.findVote(
        userId,
        commentId,
        tx,
      );

      if (existingVote) {
        if (existingVote.type === type)
          throw new BadRequestException(
            'You have already voted this way on this comment.',
          );

        await this.commentsRepository.updateVoteType(
          userId,
          commentId,
          type,
          tx,
        );
        const isNowUp = type === VoteType.UP;
        await this.commentsRepository.updateVoteCounts(
          commentId,
          {
            upIncrement: isNowUp ? 1 : -1,
            downIncrement: isNowUp ? -1 : 1,
          },
          tx,
        );
      } else {
        await this.commentsRepository.createVote(userId, commentId, type, tx);
        await this.commentsRepository.updateVoteCounts(
          commentId,
          {
            upIncrement: type === VoteType.UP ? 1 : 0,
            downIncrement: type === VoteType.DOWN ? 1 : 0,
          },
          tx,
        );
      }
    });

    return { message: 'Vote created successfully.' };
  }

  async deleteVote(userId: string, commentId: string): Promise<HttpResponse> {
    const vote = await this.commentsRepository.findVote(userId, commentId);
    if (!vote)
      throw new BadRequestException('You have not voted for this comment');

    await this.prisma.$transaction(async (tx) => {
      await this.commentsRepository.deleteVote(userId, commentId, tx);
      await this.commentsRepository.updateVoteCounts(
        commentId,
        {
          upIncrement: vote.type === VoteType.UP ? -1 : 0,
          downIncrement: vote.type === VoteType.DOWN ? -1 : 0,
        },
        tx,
      );
    });

    return { message: 'Vote deleted successfully.' };
  }
}
