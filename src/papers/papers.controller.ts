import {
  Controller,
  Post,
  Param,
  Delete,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import { PapersService } from './papers.service';
import { IdDto } from 'src/common/dto/id.dto';
import type { Request } from 'express';

@Controller('papers')
export class PapersController {
  constructor(private readonly papersService: PapersService) {}

  @HttpCode(HttpStatus.OK)
  @Post(':id/save')
  savePaper(@Param() { id }: IdDto, @Req() req: Request) {
    const userId = req.user!.id;
    return this.papersService.savePaper(id, userId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id/save')
  deleteSavedPaper(@Param() { id }: IdDto, @Req() req: Request) {
    const userId = req.user!.id;
    this.papersService.deleteSavedPaper(id, userId);
  }
}
