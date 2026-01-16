import { Module } from '@nestjs/common';
import { LibraryService } from './library.service';
import { LibraryController } from './library.controller';
import { LibraryRepository } from './repositories/library.repository';

/**
 * LibraryModule
 * 
 * Encapsulates library-related functionality for managing user's saved papers.
 * Provides controllers, services, and repositories for library operations.
 * 
 * Includes:
 * - LibraryController: HTTP endpoints for library operations
 * - LibraryService: Business logic layer
 * - LibraryRepository: Data access layer
 */
@Module({
  controllers: [LibraryController],
  providers: [LibraryService, LibraryRepository],
})
export class LibraryModule {}
