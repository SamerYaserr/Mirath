import {
  Controller,
  Post,
  Param,
  Delete,
  Req,
  HttpStatus,
  HttpCode,
  Get,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import type { Request } from 'express';
import { PapersService } from './papers.service';
import { SearchPaperDto } from './dto/search-paper.dto';
import { IdDto } from 'src/common/dto/id.dto';

@ApiTags('Papers')
@Controller('papers')
export class PapersController {
  constructor(private readonly papersService: PapersService) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Save a paper',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Save a paper to library',
    example: {
      message: 'Paper saved successfully',
      data: {
        id: 'paper-id-123',
        userId: 'user-id-456',
        paperId: 'paper-id-123',
        createdAt: '2025-12-10T10:30:00.000Z',
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'No paper found with this id',
  })
  @ApiResponse({
    status: HttpStatus.CONFLICT,
    description: 'This paper is already saved',
  })
  @HttpCode(HttpStatus.OK)
  @Post(':id/save')
  savePaper(@Param() { id }: IdDto, @Req() req: Request) {
    const userId = req.user!.id;
    return this.papersService.savePaper(id, userId);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a saved paper',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Saved paper deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Paper not found',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'This paper was not in your saved list',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id/save')
  deleteSavedPaper(@Param() { id }: IdDto, @Req() req: Request) {
    const userId = req.user!.id;
    return this.papersService.deleteSavedPaper(id, userId);
  }

  @Get('search')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Search papers',
    description:
      'Performs a full-text fuzzy search on papers. Returns results in the standard HttpResponse format.',
  })
  @ApiResponse({
    status: 200,
    description: 'Search results retrieved successfully.',
    schema: {
      example: {
        message: 'Search results retrieved successfully',
        data: [
          {
            id: '123e4567-e89b-12d3-a456-426614174000',
            title: 'Quantum Computing Advances',
            abstract: 'In this paper we discuss...',
            publishedAt: '2025-01-01T00:00:00.000Z',
            isSaved: true,
          },
        ],
        size: 1,
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  async search(@Req() req: Request, @Query() searchDto: SearchPaperDto) {
    const userId = req.user!.id;
    return this.papersService.search(userId, searchDto);
  }
}
