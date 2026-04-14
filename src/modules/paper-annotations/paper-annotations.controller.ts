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
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiExtraModels,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';

import { IdDto } from 'src/common/dto/id.dto';
import { NoteReqDto } from './dto/requests/note.req.dto';
import { HttpResponse } from 'src/common/types/api.types';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { HighlightParamsDto } from './dto/highlight-params.dto';
import { HighlightResDto } from './dto/responses/Highlight.res.dto';
import { PaperAnnotationsService } from './paper-annotations.service';

@ApiTags('Paper Annotations')
@ApiBearerAuth()
@ApiExtraModels(HighlightResDto, HighlightParamsDto, NoteReqDto)
@Controller('papers/:id/highlights')
export class PaperAnnotationsController {
  constructor(
    private readonly paperAnnotationsService: PaperAnnotationsService,
  ) {}

  @Post('/:highlightId/note')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add a note to a highlight',
    description:
      'Attaches a text note to an existing highlight. ' +
      'The highlight must belong to the requesting user and be within the specified paper. ',
  })
  @ApiBody({ type: NoteReqDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Note added successfully. Returns the updated highlight.',
    schema: {
      properties: {
        data: { $ref: getSchemaPath(HighlightResDto) },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  @ApiNotFoundResponse({ description: 'No highlight found with this id.' })
  @ApiBadRequestResponse({
    description: 'This highlight does not belong to the given paper.',
  })
  @ApiForbiddenResponse({
    description: 'You do not have permission to perform this action.',
  })
  @ApiConflictResponse({
    description: 'This highlight already has a note. Use PATCH to update it.',
  })
  takeNote(
    @Req() req: Request,
    @Body() { note }: NoteReqDto,
    @Param() { highlightId, id }: HighlightParamsDto,
  ): Promise<HttpResponse> {
    const userId = req.user!.id;
    return this.paperAnnotationsService.takeNote(userId, highlightId, id, note);
  }

  @Patch('/:highlightId/note')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Edit a note on a highlight',
    description: 'Updates the existing note on a highlight. ',
  })
  @ApiBody({ type: NoteReqDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Note updated successfully. Returns the updated highlight.',
    schema: {
      properties: {
        data: { $ref: getSchemaPath(HighlightResDto) },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  @ApiNotFoundResponse({
    description:
      'No highlight found with this id, OR no note found on this highlight.',
  })
  @ApiBadRequestResponse({
    description: 'This highlight does not belong to the given paper.',
  })
  @ApiForbiddenResponse({
    description: 'You do not have permission to perform this action.',
  })
  editNote(
    @Req() req: Request,
    @Body() { note }: NoteReqDto,
    @Param() { highlightId, id }: HighlightParamsDto,
  ): Promise<HttpResponse> {
    const userId = req.user!.id;
    return this.paperAnnotationsService.editNote(userId, highlightId, id, note);
  }

  @Delete('/:highlightId/note')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a note from a highlight',
    description:
      'Removes the note from a highlight, leaving the highlight itself intact.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Note deleted successfully.',
    schema: {
      properties: {
        message: { type: 'string', example: 'Note deleted successfully.' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  @ApiNotFoundResponse({
    description:
      'No highlight found with this id, OR no note found on this highlight.',
  })
  @ApiBadRequestResponse({
    description: 'This highlight does not belong to the given paper.',
  })
  @ApiForbiddenResponse({
    description: 'You do not have permission to perform this action.',
  })
  deleteNote(
    @Req() req: Request,
    @Param() { highlightId, id }: HighlightParamsDto,
  ): Promise<HttpResponse> {
    const userId = req.user!.id;
    return this.paperAnnotationsService.deleteNote(userId, highlightId, id);
  }

  @Get('/notes')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all notes for a paper',
    description:
      "Returns all of the current user's highlights that have a note on the given paper, " +
      'ordered by most recently updated. Supports pagination via page and limit query params.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number (1-indexed). Defaults to 1.',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 20,
    description: 'Number of results per page. Defaults to 20.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Annotated highlights fetched successfully.',
    schema: {
      properties: {
        size: { type: 'number', example: 2 },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(HighlightResDto) },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
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
