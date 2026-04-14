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
} from '@nestjs/swagger';

import { PaperAnnotationsService } from './paper-annotations.service';
import { CreateHighlightReqDto } from './dto/requests/create-highlight.req.dto';
import { UpdateHighlightReqDto } from './dto/requests/update-highlight.req.dto';
import { HighlightResDto } from './dto/responses/Highlight.res.dto';
import { HttpResponse } from 'src/common/types/api.types';
import { GetHighlightsQueryDto } from './dto/requests/get-highlights-query.dto';

@ApiTags('Paper Annotations')
@ApiBearerAuth()
@Controller('papers/:id/highlights')
@ApiExtraModels(HighlightResDto)
export class PaperAnnotationsController {
  constructor(private readonly service: PaperAnnotationsService) {}

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
    return this.service.create(req.user!.id, paperId, dto);
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
    return this.service.findAll(req.user!.id, paperId, query.page, query.limit);
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
    return this.service.update(req.user!.id, highlightId, dto);
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
    return this.service.remove(req.user!.id, highlightId);
  }
}
