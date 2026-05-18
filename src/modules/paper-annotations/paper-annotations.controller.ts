import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  Req,
  HttpStatus,
  HttpCode,
} from '@nestjs/common';
import type { Request } from 'express';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiForbiddenResponse,
  ApiBadRequestResponse,
  ApiExtraModels,
  getSchemaPath,
  ApiBody,
  ApiConflictResponse,
  ApiQuery,
} from '@nestjs/swagger';

import { PaperAnnotationsService } from './paper-annotations.service';
import { CreateHighlightReqDto } from './dto/requests/create-highlight.req.dto';
import { UpdateHighlightReqDto } from './dto/requests/update-highlight.req.dto';
import { HighlightResDto } from './dto/responses/Highlight.res.dto';
import { HttpResponse } from 'src/common/types/api.types';
import { GetHighlightsQueryDto } from './dto/requests/get-highlights-query.dto';
import { IdDto } from 'src/common/dto/id.dto';
import { NoteReqDto } from './dto/requests/note.req.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';
import { HighlightParamsDto } from './dto/highlight-params.dto';
import { ExplainReqDto } from './dto/requests/explain.req.dto';
import { SummarizeDto } from './dto/requests/summarize.req.dto';
import { AiServiceResDto } from './dto/responses/ai-service.res.dto';
import { TranslateReqDto } from './dto/requests/translate.req.dto';

@ApiTags('Paper Annotations')
@ApiBearerAuth()
@ApiExtraModels(
  NoteReqDto,
  HighlightResDto,
  AiServiceResDto,
  HighlightParamsDto,
)
@Controller('papers/:id/highlights')
export class PaperAnnotationsController {
  constructor(
    private readonly paperAnnotationsService: PaperAnnotationsService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a highlight for a paper' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Highlight created successfully.',
    schema: {
      properties: {
        data: { $ref: getSchemaPath(HighlightResDto) },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  @ApiNotFoundResponse({ description: 'Paper not found.' })
  create(
    @Req() req: Request,
    @Param('id') paperId: string,
    @Body() dto: CreateHighlightReqDto,
  ): Promise<HttpResponse<HighlightResDto>> {
    return this.paperAnnotationsService.create(req.user!.id, paperId, dto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'List highlights for a paper' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Highlights retrieved successfully.',
    schema: {
      properties: {
        size: { type: 'number', example: 12 },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(HighlightResDto) },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  findAll(
    @Req() req: Request,
    @Param('id') paperId: string,
    @Query() query: GetHighlightsQueryDto,
  ): Promise<HttpResponse<HighlightResDto[]>> {
    return this.paperAnnotationsService.findAll(
      req.user!.id,
      paperId,
      query.page,
      query.limit,
    );
  }

  @Patch(':highlightId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a highlight color' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Highlight updated successfully.',
    schema: {
      properties: {
        data: { $ref: getSchemaPath(HighlightResDto) },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  @ApiNotFoundResponse({ description: 'Highlight not found.' })
  @ApiForbiddenResponse({ description: 'Not the highlight owner.' })
  update(
    @Req() req: Request,
    @Param('highlightId') highlightId: string,
    @Body() dto: UpdateHighlightReqDto,
  ): Promise<HttpResponse<HighlightResDto>> {
    return this.paperAnnotationsService.update(req.user!.id, highlightId, dto);
  }

  @Delete(':highlightId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Delete a highlight' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Highlight deleted successfully.',
    schema: {
      properties: {
        message: { type: 'string', example: 'Highlight deleted successfully' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  @ApiNotFoundResponse({ description: 'Highlight not found.' })
  @ApiForbiddenResponse({ description: 'Not the highlight owner.' })
  remove(
    @Req() req: Request,
    @Param('highlightId') highlightId: string,
  ): Promise<HttpResponse> {
    return this.paperAnnotationsService.remove(req.user!.id, highlightId);
  }

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

  @Post('/summarize')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Summarize a text snippet',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Text summarized successfully.',
    schema: {
      properties: {
        data: { $ref: getSchemaPath(AiServiceResDto) },
      },
    },
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Paper not found.',
  })
  summarize(
    @Param() { id }: IdDto,
    @Body() dto: SummarizeDto,
  ): Promise<HttpResponse<AiServiceResDto>> {
    return this.paperAnnotationsService.summarizeText({
      id,
      ...dto,
    });
  }

  @Post('/explain')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Explain a highlighted text',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Text explained successfully.',
    schema: {
      properties: {
        data: { $ref: getSchemaPath(AiServiceResDto) },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'No paper found with this is.' })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  explain(
    @Param() { id }: IdDto,
    @Body() dto: ExplainReqDto,
  ): Promise<HttpResponse<AiServiceResDto>> {
    return this.paperAnnotationsService.explainText({ id, ...dto });
  }

  @Post('/translate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Translate a highlighted text',
    description:
      'Translates the selected text into the specified target language ' +
      'by proxying to the AI service. The source language is detected automatically ' +
      'by the AI service.',
  })
  @ApiBody({ type: TranslateReqDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Text translated successfully.',
    schema: {
      properties: {
        data: { $ref: getSchemaPath(AiServiceResDto) },
      },
    },
  })
  @ApiNotFoundResponse({ description: 'No paper found with this id.' })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  @ApiBadRequestResponse({ description: 'Validation failed.' })
  translate(
    @Param() { id }: IdDto,
    @Body() dto: TranslateReqDto,
  ): Promise<HttpResponse<AiServiceResDto>> {
    return this.paperAnnotationsService.translateText(
      id,
      dto.selectedText,
      dto.targetLanguage,
    );
  }
}
