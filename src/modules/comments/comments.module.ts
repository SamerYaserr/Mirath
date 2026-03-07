import { Module } from '@nestjs/common';

import { CommentsService } from './comments.service';
import { CommentsController } from './comments.controller';
import { CommentsRepository } from './repositories/comments.repository';
import { CommentVotesRepository } from './repositories/comment-votes.repository';

@Module({
  controllers: [CommentsController],
  providers: [CommentsService, CommentsRepository, CommentVotesRepository],
  exports: [CommentsRepository],
})
export class CommentsModule {}
