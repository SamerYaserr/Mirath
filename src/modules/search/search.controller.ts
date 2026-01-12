import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
} from '@nestjs/swagger';
import {
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';

import { IdDto } from 'src/common/dto/id.dto';
import { SearchService } from './search.service';
import { AuthGuard } from '../auth/guards/auth.guard';
import { SearchHistoryQueryDto } from './dto/search-history-query.dto';

@Controller('search')
@UseGuards(AuthGuard)
export class SearchController {
  constructor(private searchService: SearchService) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete search query by id',
    description: `Delete a search query from the current user's search history by the search query id`,
  })
  @ApiResponse({
    status: 204,
    description: 'Search query deleted successfully',
  })
  @ApiNotFoundResponse({
    description:
      'Search history not found or does not belong to the current user',
    schema: {
      example: {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'No search query found with this id',
        error: 'Not Found',
      },
    },
  })
  @Delete('history/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteSearchQuery(@Param() { id }: IdDto, @Req() req: Request) {
    return this.searchService.deleteSearchQuery(id, req.user!.id);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete all current user search history',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Search history deleted successfully',
  })
  @Delete('history')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAll(@Req() req: Request) {
    return this.searchService.deleteAll(req.user!.id);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get current user search history',
  })
  @ApiResponse({
    status: 200,
    description: 'Search history retrieved successfully',
    schema: {
      example: {
        size: 2,
        data: [
          {
            id: '550e8400-e29b-41d4-a716-446655440000',
            query: 'machine learning',
            userId: '550e8400-e29b-41d4-a716-446655440001',
            createdAt: '2026-01-12T10:00:00.000Z',
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            query: 'neural networks',
            userId: '550e8400-e29b-41d4-a716-446655440001',
            createdAt: '2026-01-11T15:30:00.000Z',
          },
        ],
      },
    },
  })
  @Get('history')
  getSearchHistory(
    @Req() req: Request,
    @Query() { limit }: SearchHistoryQueryDto,
  ) {
    return this.searchService.getSearchHistory(req.user!.id, limit);
  }
}
