import { Module } from '@nestjs/common';
import { FeedController } from './feed.controller';
import { FeedService } from './feed.service';
import { PrismaModule } from '../prisma/prisma.module';
import { FeedRepository } from './repositories/feed.repository';

@Module({
  imports: [PrismaModule],
  controllers: [FeedController],
  providers: [FeedService, FeedRepository],
})
export class FeedModule {}
