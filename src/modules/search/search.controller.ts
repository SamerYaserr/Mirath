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
  HttpCode,
  HttpStatus,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';

import { IdDto } from 'src/common/dto/id.dto';
import { SearchService } from './search.service';
import { AuthGuard } from '../auth/guards/auth.guard';

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
        statusCode: 404,
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
    status: 204,
    description: 'Search history deleted successfully',
  })
  @Delete('history')
  @HttpCode(HttpStatus.NO_CONTENT)
  deleteAll(@Req() req: Request) {
    return this.searchService.deleteAll(req.user!.id);
  }
}
