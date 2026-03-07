import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  getSchemaPath,
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
import { SearchHistoryQueryReqDto } from './dto/requests/search-history-query.req.dto';
import { SearchQueryReqDto } from './dto/requests/search-query.req.dto';
import {
  SearchHistoryEntryResDto,
  SearchUserResDto,
} from './dto/responses/shared.res.dto';
import { GlobalSearchResDto } from './dto/responses/search-global.res.dto';
import { DiscussionSearchResDto } from './dto/responses/search-discussions.res.dto';
import { ReadingListSearchResDto } from './dto/responses/search-reading-lists.res.dto';
import { ResearcherSearchResDto } from './dto/responses/search-researchers.res.dto';
import { HttpResponse } from 'src/common/types/api.types';

@ApiTags('Search')
@ApiBearerAuth()
@ApiExtraModels(
  SearchUserResDto,
  SearchHistoryEntryResDto,
  GlobalSearchResDto,
  DiscussionSearchResDto,
  ReadingListSearchResDto,
  ResearcherSearchResDto,
)
@Controller('search')
export class SearchController {
  constructor(private searchService: SearchService) {}

  @Delete('history/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
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
  })
  deleteSearchQuery(
    @Param() { id }: IdDto,
    @Req() req: Request,
  ): Promise<HttpResponse<null>> {
    return this.searchService.deleteSearchQuery(id, req.user!.id);
  }

  @Delete('history')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete all current user search history',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Search history deleted successfully',
  })
  deleteAll(@Req() req: Request): Promise<HttpResponse<null>> {
    return this.searchService.deleteAll(req.user!.id);
  }

  @Get('history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get current user search history',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search history retrieved successfully',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Search history retrieved successfully',
        },
        size: { type: 'number', example: 2 },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(SearchHistoryEntryResDto) },
        },
      },
    },
  })
  getSearchHistory(
    @Req() req: Request,
    @Query() { limit }: SearchHistoryQueryReqDto,
  ): Promise<HttpResponse<SearchHistoryEntryResDto[]>> {
    return this.searchService.getSearchHistory(req.user!.id, limit);
  }

  @Get('global')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Global Search',
    description:
      'Aggregated search across Discussions, Reading Lists, and Researchers. ' +
      'Returns the top matches for each category based on the limit provided.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Global search results retrieved successfully.',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Global search results retrieved successfully',
        },
        data: {
          type: 'object',
          $ref: getSchemaPath(GlobalSearchResDto),
        },
      },
    },
  })
  async searchGlobal(
    @Req() req: Request,
    @Query() searchQueryReqDto: SearchQueryReqDto,
  ): Promise<HttpResponse<GlobalSearchResDto>> {
    return this.searchService.searchGlobal(
      req.user!.id,
      searchQueryReqDto.query,
      searchQueryReqDto.page,
      searchQueryReqDto.limit,
    );
  }

  @Get('discussions')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search Discussions',
    description:
      'Search specifically through discussions. Returns a paginated list of discussions matching the query, including author details, follow status, and tags.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Discussion search results retrieved successfully.',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Discussion search results retrieved successfully',
        },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(DiscussionSearchResDto) },
        },
      },
    },
  })
  async searchDiscussions(
    @Req() req: Request,
    @Query() dto: SearchQueryReqDto,
  ): Promise<HttpResponse<DiscussionSearchResDto[]>> {
    return this.searchService.searchDiscussions(
      req.user!.id,
      dto.query,
      dto.page,
      dto.limit,
    );
  }

  @Get('reading-lists')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search Reading Lists',
    description:
      'Search through reading lists. Returns a paginated list of reading lists matching the query, including the paper count, save status, and owner details.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reading list search results retrieved successfully.',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Reading List search results retrieved successfully',
        },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(ReadingListSearchResDto) },
        },
      },
    },
  })
  async searchReadingLists(
    @Req() req: Request,
    @Query() dto: SearchQueryReqDto,
  ): Promise<HttpResponse<ReadingListSearchResDto[]>> {
    return this.searchService.searchReadingLists(
      req.user!.id,
      dto.query,
      dto.page,
      dto.limit,
    );
  }

  @Get('researchers')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search Researchers',
    description:
      'Fuzzy search for researchers by name, username, or bio. Returns profile details including university info and follow status.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Researcher search results retrieved successfully.',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Researcher search results retrieved successfully',
        },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(ResearcherSearchResDto) },
        },
      },
    },
  })
  async searchResearchers(
    @Req() req: Request,
    @Query() dto: SearchQueryReqDto,
  ): Promise<HttpResponse<ResearcherSearchResDto[]>> {
    return this.searchService.searchResearchers(
      req.user!.id,
      dto.query,
      dto.page,
      dto.limit,
    );
  }
}
