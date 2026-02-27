import { Module } from '@nestjs/common';
import { LibraryService } from './library.service';
import { LibraryController } from './library.controller';
import { SavedPapersRepository } from '../papers/repositories/saved-papers.repository';

@Module({
  controllers: [LibraryController],
  providers: [LibraryService, SavedPapersRepository],
})
export class LibraryModule {}
