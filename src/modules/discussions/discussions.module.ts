import { Module } from '@nestjs/common';
import { UsersModule } from '../users/users.module';
import { DiscussionsService } from './discussions.service';
import { DiscussionsController } from './discussions.controller';
import { DiscussionsRepository } from './repositories/discussions.repository';
import { DiscussionVotesRepository } from './repositories/discussion-votes.repository';
import { PapersModule } from '../papers/papers.module';
import { CommentsModule } from '../comments/comments.module';
import { InterestsModule } from '../interests/interests.module';

@Module({
  imports: [UsersModule, PapersModule, CommentsModule, InterestsModule],
  controllers: [DiscussionsController],
  providers: [
    DiscussionsService,
    DiscussionsRepository,
    DiscussionVotesRepository,
  ],
})
export class DiscussionsModule {}
