import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Query,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiBadRequestResponse,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
  ApiNotFoundResponse,
} from '@nestjs/swagger';

import { LibraryService } from './library.service';
import { GetSavedPapersReqDto } from './dto/requests/get-saved-papers.req.dto';
import { SavedPapersResDto } from './dto/responses/saved-paper-summary.res.dto';
import { ReadingHistoryResDto } from './dto/responses/reading-history.res.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { HttpResponse } from 'src/common/types/api.types';

@ApiTags('Library')
@ApiBearerAuth()
@Controller('library')
@ApiExtraModels(SavedPapersResDto, ReadingHistoryResDto)
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get('saved')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all saved papers',
    description:
      'Retrieves all papers saved by the authenticated user with pagination and sorting options.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved saved papers.',
    schema: {
      properties: {
        size: { type: 'number', example: 2 },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(SavedPapersResDto) },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters.' })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  findAll(@Req() req: Request, @Query() q: GetSavedPapersReqDto) {
    const userId = req.user!.id;
    const { page, limit, sort } = q;

    return this.libraryService.findAll(userId, page, limit, sort);
  }

  @Post('reading-history/:paperId')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Update reading history' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Reading history updated',
    schema: { properties: { message: { type: 'string', example: 'Reading history updated' } } }
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  @ApiNotFoundResponse({ description: 'Paper not found.' })
  updateReadingHistory(@Req() req: Request, @Param('paperId') paperId: string): Promise<HttpResponse> {
    return this.libraryService.updateReadingHistory(req.user!.id, paperId);
  }

  @Get('reading-history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get reading history' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved reading history.',
    schema: {
      properties: {
        size: { type: 'number', example: 84 },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(ReadingHistoryResDto) },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters.' })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  getReadingHistory(@Req() req: Request, @Query() q: PaginationDto): Promise<HttpResponse<ReadingHistoryResDto[]>> {
    const { page, limit } = q;
    return this.libraryService.getReadingHistory(req.user!.id, page, limit);
  }

  @Delete('reading-history')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Clear all reading history' })
  @ApiResponse({ 
    status: 200,
    description: 'Reading history cleared successfully',
    schema: { 
      properties: { 
        message: { type: 'string', example: 'Reading history cleared successfully' } 
      } 
    } 
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  clearReadingHistory(@Req() req: Request): Promise<HttpResponse> {
    return this.libraryService.clearReadingHistory(req.user!.id);
  }

  @Delete('reading-history/:paperId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a paper from reading history' })
  @ApiResponse({ 
    status: 200, 
    description: 'Paper removed from reading history',
    schema: { 
      properties: { 
        message: { type: 'string', example: 'Paper removed from reading history' } 
      } 
    } 
   })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  @ApiNotFoundResponse({ description: 'Paper not found in reading history.' })
  removePaperFromHistory(@Req() req: Request, @Param('paperId') paperId: string): Promise<HttpResponse> {
    return this.libraryService.removePaperFromHistory(req.user!.id, paperId);
  }
}
