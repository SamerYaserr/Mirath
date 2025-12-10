import { Module } from '@nestjs/common';
import { InterestsRepository } from './repositories/interests.repository';
import { InterestsService } from './interests.service';
import { UserInterestsRepository } from './repositories/user-interests.repository';
import { InterestsController } from './interests.controller';

@Module({
  controllers: [InterestsController],
  providers: [InterestsRepository, InterestsService, UserInterestsRepository],
  exports: [InterestsService, InterestsRepository, UserInterestsRepository],
})
export class InterestsModule {}
