import { Module } from '@nestjs/common';
import { DiscussionsService } from './discussions.service';
import { DiscussionsController } from './discussions.controller';
import { DiscussionsRepository } from './repositories/discussions.repository';

@Module({
  controllers: [DiscussionsController],
  providers: [DiscussionsService, DiscussionsRepository],
})
export class DiscussionsModule {}
