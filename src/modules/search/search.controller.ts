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
} from '@nestjs/common';

import { IdDto } from 'src/common/dto/id.dto';
import { SearchService } from './search.service';
import { SearchHistoryQueryDto } from './dto/search-history-query.dto';
import { SearchQueryDto } from './dto/search-query.dto';

@Controller('search')
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

  @Get('global')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Global Search',
    description:
      'Aggregated search across Discussions, Reading Lists, and Researchers. Returns the top matches for each category based on the limit provided.',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully.',
    schema: {
      example: {
        message: 'Global search results retrieved successfully',
        data: {
          discussions: [
            {
              id: '123e4567-e89b-12d3-a456-426614174001',
              title: 'Thoughts on the new transformer architecture?',
              content: "I've been reading the paper and...",
              voteScore: 42,
              createdAt: '2024-01-20T10:00:00.000Z',
              author: {
                id: 'user-uuid',
                fullName: 'Jane Doe',
                username: 'jane_d',
                photoUrl: 'https://example.com/photo.jpg',
                isMe: false,
                isFollowing: true,
              },
              tags: ['AI', 'NLP'],
            },
          ],
          readingLists: [
            {
              id: '123e4567-e89b-12d3-a456-426614174002',
              title: 'Essential NLP Papers',
              updatedAt: '2024-01-19T10:00:00.000Z',
              owner: {
                id: 'owner-uuid',
                fullName: 'John Smith',
                username: 'jsmith',
                photoUrl: null,
                isMe: true,
                isFollowing: false,
              },
              paperCount: 12,
              isSaved: true,
            },
          ],
          researchers: [
            {
              id: '123e4567-e89b-12d3-a456-426614174003',
              fullName: 'Alice Johnson',
              username: 'alice_j',
              bio: 'PhD Student at MIT...',
              university: 'MIT',
              country: 'USA',
              photoUrl: 'https://example.com/alice.jpg',
              isFollowing: false,
            },
          ],
        },
      },
    },
  })
  async searchGlobal(
    @Req() req: Request,
    @Query() searchQueryDto: SearchQueryDto,
  ) {
    return this.searchService.searchGlobal(
      req.user!.id,
      searchQueryDto.query,
      searchQueryDto.page,
      searchQueryDto.limit,
    );
  }

  @Get('discussions')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search Discussions',
    description:
      'Search specifically through discussions. Returns a paginated list of discussions matching the query, including author details, follow status, and tags.',
  })
  @ApiResponse({
    status: 200,
    description: 'Discussion search results retrieved successfully.',
    schema: {
      example: {
        message: 'Discussion search results retrieved successfully',
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174001',
            title: 'Is prompt engineering dead?',
            content: 'With the rise of reasoning models, I feel like...',
            voteScore: 156,
            createdAt: '2024-02-15T14:30:00.000Z',
            tags: ['AI', 'LLM', 'Future Tech'],
            author: {
              id: 'user-uuid-1',
              fullName: 'Sarah Connor',
              username: 's_connor',
              photoUrl: 'https://example.com/sarah.jpg',
              isMe: false,
              isFollowing: true,
            },
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174002',
            title: 'Best practices for NestJS microservices',
            content: 'I am struggling with shared DTOs in a monorepo...',
            voteScore: 89,
            createdAt: '2024-02-10T09:15:00.000Z',
            tags: ['Backend', 'NestJS', 'Architecture'],
            author: {
              id: 'user-uuid-2',
              fullName: 'John Smith',
              username: 'jsmith_dev',
              photoUrl: null,
              isMe: true,
              isFollowing: false,
            },
          },
        ],
      },
    },
  })
  async searchDiscussions(@Req() req: Request, @Query() dto: SearchQueryDto) {
    return this.searchService.searchDiscussions(
      req.user!.id,
      dto.query,
      dto.page,
      dto.limit,
    );
  }

  @Get('reading-lists')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search Reading Lists',
    description:
      'Search through reading lists. Returns a paginated list of reading lists matching the query, including the paper count, save status, and owner details.',
  })
  @ApiResponse({
    status: 200,
    description: 'Reading list search results retrieved successfully.',
    schema: {
      example: {
        message: 'Reading List search results retrieved successfully',
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174005',
            title: 'Foundational Computer Vision Papers',
            updatedAt: '2024-03-10T08:00:00.000Z',
            paperCount: 24,
            isSaved: true,
            owner: {
              id: 'user-uuid-88',
              fullName: 'Alice Chen',
              username: 'alice_cv',
              photoUrl: 'https://example.com/alice.jpg',
              isMe: false,
              isFollowing: true,
            },
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174006',
            title: 'My Thesis References',
            updatedAt: '2024-03-01T12:00:00.000Z',
            paperCount: 8,
            isSaved: false,
            owner: {
              id: 'user-uuid-99',
              fullName: 'Bob Ross',
              username: 'happy_accidents',
              photoUrl: null,
              isMe: true,
              isFollowing: false,
            },
          },
        ],
      },
    },
  })
  async searchReadingLists(@Req() req: Request, @Query() dto: SearchQueryDto) {
    return this.searchService.searchReadingLists(
      req.user!.id,
      dto.query,
      dto.page,
      dto.limit,
    );
  }

  @Get('researchers')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search Researchers',
    description:
      'Fuzzy search for researchers by name, username, or bio. Returns profile details including university info and follow status.',
  })
  @ApiResponse({
    status: 200,
    description: 'Researcher search results retrieved successfully.',
    schema: {
      example: {
        message: 'Researcher search results retrieved successfully',
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174008',
            fullName: 'Dr. Emily Carter',
            username: 'emily_carter_phd',
            bio: 'Researching quantum computing algorithms...',
            university: 'Stanford University',
            country: 'USA',
            photoUrl: 'https://example.com/emily.jpg',
            isFollowing: true,
          },
          {
            id: '123e4567-e89b-12d3-a456-426614174009',
            fullName: 'Raj Patel',
            username: 'raj_ai_research',
            bio: 'Focusing on Ethics in AI.',
            university: 'Imperial College London',
            country: 'UK',
            photoUrl: null,
            isFollowing: false,
          },
        ],
      },
    },
  })
  async searchResearchers(@Req() req: Request, @Query() dto: SearchQueryDto) {
    return this.searchService.searchResearchers(
      req.user!.id,
      dto.query,
      dto.page,
      dto.limit,
    );
  }
}
