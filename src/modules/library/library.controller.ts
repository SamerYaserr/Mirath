import { Controller, Get, Query, Req } from '@nestjs/common';

import type { Request } from 'express';
import { LibraryService } from './library.service';
import type { QueryString } from 'src/common/types/api.types';

@Controller('library')
export class LibraryController {
  constructor(private readonly libraryService: LibraryService) {}

  @Get('saved')
  findAll(@Req() req: Request, @Query() q: QueryString) {
    const userId = req.user!.id;
    const page = q.page ? parseInt(q.page) : 1;
    const limit = q.limit ? parseInt(q.limit) : 10;
    const sort = q.sort || 'desc';
    return this.libraryService.findAll(userId, page, limit, sort);
  }
}
