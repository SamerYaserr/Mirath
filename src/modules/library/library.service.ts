import { Injectable } from '@nestjs/common';
import { LibraryRepository } from './repositories/library.repository';
import { HttpResponse } from 'src/common/types/api.types';

/**
 * LibraryService
 * 
 * Provides business logic for library operations.
 * Handles pagination, filtering, and data transformation for saved papers.
 * 
 * Responsibilities:
 * - Calculate pagination offsets
 * - Retrieve and format saved papers
 * - Construct HTTP responses
 */
@Injectable()
export class LibraryService {
  constructor(private libraryRepository: LibraryRepository) {}

  /**
   * Retrieves all saved papers for a user with pagination and sorting
   * 
   * @param userId - The ID of the user
   * @param page - Page number for pagination (default: 1)
   * @param limit - Number of items per page (default: 10)
   * @param sort - Sort order: 'asc' for ascending or 'desc' for descending (default: 'desc')
   * @returns Promise resolving to HttpResponse with papers array and size metadata
   * 
   * @example
   * const response = await libraryService.findAll('user-123', 1, 10, 'desc');
   * // Returns: { size: 10, data: [...papers] }
   */
  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 10,
    sort: string = 'desc',
  ): Promise<HttpResponse> {
    const skip = (page - 1) * limit;
    const papers = await this.libraryRepository.findAll(
      userId,
      skip,
      limit,
      sort,
    );

    return { size: papers.length, data: papers };
  }
}
