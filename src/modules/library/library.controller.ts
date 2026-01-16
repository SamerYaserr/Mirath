import { Controller, Get, Query, Req, HttpStatus } from '@nestjs/common';

import type { Request } from 'express';
import { LibraryService } from './library.service';
import type { QueryString } from 'src/common/types/api.types';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';

/**
 * LibraryController
 * 
 * Handles HTTP requests related to user library operations.
 * Provides endpoints for managing saved papers in a user's library.
 */
@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  /**
   * Retrieves all saved papers for the authenticated user
   * 
   * @param req - Express request object containing authenticated user information
   * @param q - Query parameters for pagination and sorting
   * @param q.page - Page number (default: 1)
   * @param q.limit - Number of items per page (default: 10)
   * @param q.sort - Sort order: 'asc' or 'desc' (default: 'desc')
   * @returns Promise resolving to saved papers with pagination metadata
   * 
   * @example
   * GET /library/saved?page=1&limit=10&sort=desc
   */
  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all saved papers',
    description: 'Retrieves all papers saved by the authenticated user with pagination and sorting options',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Page number for pagination (default: 1)',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Number of items per page (default: 10)',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    type: String,
    enum: ['asc', 'desc'],
    description: 'Sort order by creation date (default: desc)',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved saved papers',
    example: {
      size: 2,
      data: [
        {
          id: 'saved-id-1',
          userId: 'user-id-123',
          paperId: 'paper-id-1',
          createdAt: '2025-12-10T10:30:00.000Z',
          paper: {
            id: 'paper-id-1',
            title: 'Sample Paper',
            abstract: 'Paper abstract',
            authors: 'Author Name',
          },
        },
      ],
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - authentication required',
  })
  @Get('saved')
  findAll(@Req() req: Request, @Query() q: QueryString) {
    const userId = req.user!.id;
    
    const page = q.page ? parseInt(q.page) : 1;
    const limit = q.limit ? parseInt(q.limit) : 10;
    const sort = q.sort || 'desc';

    return this.libraryService.findAll(userId, page, limit, sort);
  }
}
