import {
  Controller,
  Get,
  Query,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

import { LibraryService } from './library.service';
import { GetSavedPapersDto } from './dtos/get-saved-papers.dto';

@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all saved papers',
    description:
      'Retrieves all papers saved by the authenticated user with pagination and sorting options',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved saved papers',
    schema: {
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
    },
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid query parameters',
    schema: {
      example: {
        statusCode: 400,
        message: ['Limit must be an integer'],
        error: 'Bad Request',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - authentication required',
  })
  @HttpCode(HttpStatus.OK)
  @Get('saved')
  findAll(@Req() req: Request, @Query() q: GetSavedPapersDto) {
    const userId = req.user!.id;
    const { page, limit, sort } = q;

    return this.libraryService.findAll(userId, page, limit, sort);
  }
}
