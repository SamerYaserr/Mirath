import { Module } from '@nestjs/common';
import { LibraryService } from './library.service';
import { LibraryController } from './library.controller';
import { SavedPapersRepository } from '../papers/repositories/saved-papers.repository';
import { ReadingHistoryRepository } from './repositories/reading-history.repository';
import { PapersRepository } from '../papers/repositories/papers.repository';
import { ReadingListsRepository } from '../reading-lists/repositories/reading-lists.repository';

@Module({
  controllers: [LibraryController],
  providers: [
    LibraryService,
    SavedPapersRepository,
    ReadingHistoryRepository,
    PapersRepository,
    ReadingListsRepository,
  ],
})
export class LibraryModule {}
