import { Module } from '@nestjs/common';
import { LibraryService } from './library.service';
import { LibraryController } from './library.controller';
import { SavedPapersRepository } from '../papers/repositories/saved-papers.repository';
import { ReadingHistoryRepository } from './repositories/reading-history.repository';
import { PapersRepository } from '../papers/repositories/papers.repository';

@Module({
  controllers: [LibraryController],
  providers: [LibraryService, SavedPapersRepository, ReadingHistoryRepository, PapersRepository],
})
export class LibraryModule {}
