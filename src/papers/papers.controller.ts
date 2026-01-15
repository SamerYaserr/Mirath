import { Controller, Post, Param, Delete, Req } from '@nestjs/common';
import { PapersService } from './papers.service';
import { IdDto } from 'src/common/dto/id.dto';
import type { Request } from 'express';

@Controller('papers')
export class PapersController {
  constructor(private readonly papersService: PapersService) {}

  @Post(':id/save')
  savePaper(@Param() { id }: IdDto, @Req() req: Request) {
    const userId = req.user!.id;
    return this.papersService.savePaper(id, userId);
  }

  @Delete(':id/save')
  deleteSavedPaper(@Param() { id }: IdDto, @Req() req: Request) {
    const userId = req.user!.id;
    return this.papersService.deleteSavedPaper(id, userId);
  }
}
