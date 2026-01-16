import { Injectable } from '@nestjs/common';
import { Paper, SavedPaper } from '@prisma/client';
import { PrismaService } from 'src/modules/prisma/prisma.service';

/**
 * SavedPaperWithPaper
 * 
 * Type representing a SavedPaper record with its associated Paper details.
 * Used for returning complete paper information along with save metadata.
 */
type SavedPaperWithPaper = SavedPaper & {
  paper: Paper;
};

/**
 * LibraryRepository
 * 
 * Data access layer for library operations.
 * Handles database queries related to saved papers.
 * 
 * Responsibilities:
 * - Execute Prisma queries for saved paper operations
 * - Handle database relationships and includes
 * - Apply pagination and sorting
 */
@Injectable()
export class LibraryRepository {
  constructor(private prisma: PrismaService) {}

  /**
   * Queries all saved papers for a user from the database
   * 
   * @param userId - The ID of the user
   * @param skip - Number of records to skip (for pagination)
   * @param limit - Maximum number of records to return
   * @param sort - Sort order: 'asc' for ascending or 'desc' for descending
   * @returns Promise resolving to array of SavedPaper records with associated Paper details
   * 
   * @throws Will throw if database query fails
   * 
   * @example
   * const papers = await libraryRepository.findAll('user-123', 0, 10, 'desc');
   */
  async findAll(
    userId: string,
    skip: number,
    limit: number,
    sort: string,
  ): Promise<SavedPaperWithPaper[]> {
    return this.prisma.savedPaper.findMany({
      where: {
        userId,
      },
      include: {
        paper: true,
      },
      orderBy: {
        createdAt: sort === 'asc' ? 'asc' : 'desc',
      },
      skip,
      take: limit,
    });
  }
}
