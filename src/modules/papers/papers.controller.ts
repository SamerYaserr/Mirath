import {
  Controller,
  Post,
  Param,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConflictResponse,
  ApiExtraModels,
  ApiNotFoundResponse,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { IdDto } from 'src/common/dto/id.dto';
import { PapersService } from './papers.service';
import { PaperResDto } from './dto/responses/paper.res.dto';
import { SavedPaperResDto } from './dto/responses/saved-paper.res.dto';
import { SearchPaperReqDto } from './dto/requests/search-paper.req.dto';
import { SearchResultResDto } from './dto/responses/search-result.res.dto';
import { SearchInPaperReqDto } from './dto/requests/search-in-paper.req.dto';
import { SearchInPaperResDto } from './dto/responses/search-in-paper.res.dto';

@ApiTags('Papers')
@ApiBearerAuth()
@Controller('papers')
@ApiExtraModels(
  PaperResDto,
  SavedPaperResDto,
  SearchResultResDto,
  SearchInPaperResDto,
)
export class PapersController {
  constructor(private readonly papersService: PapersService) {}

  @Post(':id/save')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Save a paper',
    description: "Saves a paper to the user's library.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paper saved successfully.',
    schema: {
      properties: {
        message: { type: 'string', example: 'Paper saved successfully.' },
        data: { $ref: getSchemaPath(SavedPaperResDto) },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'No paper found with this id' })
  @ApiConflictResponse({ description: 'This paper is already saved' })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  savePaper(@Param() { id }: IdDto, @Req() req: Request) {
    const userId = req.user!.id;
    return this.papersService.savePaper(id, userId);
  }

  @Delete(':id/save')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a saved paper',
    description: 'Removes a paper from the authenticated user saved list.',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Saved paper deleted successfully.',
  })
  @ApiNotFoundResponse({ description: 'Paper not found' })
  @ApiNotFoundResponse({ description: 'This paper was not in your saved list' })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  deleteSavedPaper(@Param() { id }: IdDto, @Req() req: Request) {
    const userId = req.user!.id;
    return this.papersService.deleteSavedPaper(id, userId);
  }

  @Get('search')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search papers',
    description:
      'Performs a search on papers. Returns results in the standard HttpResponse format.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search results retrieved successfully.',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Search results retrieved successfully.',
        },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(SearchResultResDto) },
        },
        size: { type: 'number', example: 1 },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  async search(@Req() req: Request, @Query() searchDto: SearchPaperReqDto) {
    const userId = req.user!.id;
    return this.papersService.search(userId, searchDto);
  }

  @ApiOperation({
    summary: 'Get paper by ID',
    description:
      'Retrieves the full details of a paper by its UUID, including citation, title, abstract, authors, categories, and content.',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the paper to retrieve',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Paper retrieved successfully',
    schema: {
      properties: {
        message: { type: 'string', example: 'Paper retrieved successfully.' },
        data: {
          type: 'object',
          properties: {
            paper: { $ref: getSchemaPath(PaperResDto) },
          },
        },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'No paper found with this id' })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  @Get(':id')
  async find(@Param() { id }: IdDto) {
    return this.papersService.find(id);
  }

  @ApiOperation({
    summary: 'Search in paper',
    description:
      'Searches for a query string within the full text of a specific paper and returns the positions of all matches.',
  })
  @ApiParam({
    name: 'id',
    description: 'The UUID of the paper to retrieve',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'q',
    description: 'The search term to find within the paper full text.',
    example: 'Commissioning',
    required: true,
    type: String,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Search results retrieved successfully.',
    schema: {
      $ref: getSchemaPath(SearchInPaperResDto),
    },
  })
  @ApiNotFoundResponse({ description: 'No paper found with this id' })
  @Get(':id/search')
  async searchInPaper(
    @Param() { id }: IdDto,
    @Query() { q }: SearchInPaperReqDto,
  ) {
    return this.papersService.searchInPaper(id, q);
  }
}
