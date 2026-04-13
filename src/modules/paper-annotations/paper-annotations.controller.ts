import {
  Req,
  Body,
  Post,
  Patch,
  Param,
  HttpCode,
  Controller,
  HttpStatus,
  Delete,
  Get,
  Query,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { HttpResponse } from 'src/common/types/api.types';
import { HighlightParamsDto } from './dto/highlight-params.dto';
import { TakeNoteReqDto } from './dto/requests/note.req.dto';
import { PaperAnnotationsService } from './paper-annotations.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { IdDto } from 'src/common/dto/id.dto';

@ApiTags('Paper Annotations')
@ApiBearerAuth()
@Controller('papers/:id/highlights')
export class PaperAnnotationsController {
  constructor(
    private readonly paperAnnotationsService: PaperAnnotationsService,
  ) {}

  @Post('/:highlightId/note')
  @HttpCode(HttpStatus.OK)
  takeNote(
    @Req() req: Request,
    @Body() { note }: TakeNoteReqDto,
    @Param() { highlightId, id }: HighlightParamsDto,
  ): Promise<HttpResponse> {
    const userId = req.user!.id;
    return this.paperAnnotationsService.takeNote(userId, highlightId, id, note);
  }

  @Patch('/:highlightId/note')
  @HttpCode(HttpStatus.OK)
  editNote(
    @Req() req: Request,
    @Body() { note }: TakeNoteReqDto,
    @Param() { highlightId, id }: HighlightParamsDto,
  ): Promise<HttpResponse> {
    const userId = req.user!.id;
    return this.paperAnnotationsService.editNote(userId, highlightId, id, note);
  }

  @Delete('/:highlightId/note')
  @HttpCode(HttpStatus.OK)
  deleteNote(
    @Req() req: Request,
    @Param() { highlightId, id }: HighlightParamsDto,
  ): Promise<HttpResponse> {
    const userId = req.user!.id;
    return this.paperAnnotationsService.deleteNote(userId, highlightId, id);
  }

  @Get('/notes')
  @HttpCode(HttpStatus.OK)
  getNotes(
    @Req() req: Request,
    @Param() { id }: IdDto,
    @Query() q: PaginationDto,
  ): Promise<HttpResponse> {
    const userId = req.user!.id;
    const { page, limit } = q;
    return this.paperAnnotationsService.getNotes(userId, id, page, limit);
  }
}
