import { Module } from '@nestjs/common';
import { ReadingListsController } from './reading-lists.controller';
import { ReadingListsService } from './reading-lists.service';
import { ReadingListsRepository } from './repositories/reading-lists.repository';

@Module({
  controllers: [ReadingListsController],
  providers: [ReadingListsService, ReadingListsRepository],
})
export class ReadingListsModule {}
