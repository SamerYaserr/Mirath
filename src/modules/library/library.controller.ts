import {
  Controller,
  Get,
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
} from '@nestjs/swagger';

import { LibraryService } from './library.service';
import { GetSavedPapersReqDto } from './dto/requests/get-saved-papers.req.dto';
import { SavedPapersResDto } from './dto/responses/saved-paper-summary.res.dto';

@ApiTags('Library')
@ApiBearerAuth()
@Controller('library')
@ApiExtraModels(SavedPapersResDto)
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
}
