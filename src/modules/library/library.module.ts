import { Module } from '@nestjs/common';
import { LibraryService } from './library.service';
import { LibraryController } from './library.controller';
import { LibraryRepository } from './repositories/library.repository';

@Module({
  controllers: [LibraryController],
  providers: [LibraryService, LibraryRepository],
})
export class LibraryModule {}
