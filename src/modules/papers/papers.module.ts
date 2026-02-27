import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PapersService } from './papers.service';
import { PapersController } from './papers.controller';
import { PapersRepository } from './repositories/papers.repository';
import { SavedPapersRepository } from './repositories/saved-papers.repository';
import { SearchHistoryRepository } from '../search/repositories/search-history.repository';

@Module({
  imports: [HttpModule],
  controllers: [PapersController],
  providers: [
    PapersService,
    PapersRepository,
    SavedPapersRepository,
    SearchHistoryRepository,
  ],
})
export class PapersModule {}
