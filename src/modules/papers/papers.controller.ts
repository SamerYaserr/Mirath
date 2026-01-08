import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Req,
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

@ApiTags('Papers')
@Controller('papers')
export class PapersController {
  constructor(private readonly papersService: PapersService) {}

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
