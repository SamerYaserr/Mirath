import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import type { Request } from 'express';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { HttpResponse } from 'src/common/types/api.types';
import { HighlightParamsDto } from './dto/highlight-params.dto';
import { TakeNoteReqDto } from './dto/requests/take-note.req.dto';
import { PaperAnnotationsService } from './paper-annotations.service';

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
}
