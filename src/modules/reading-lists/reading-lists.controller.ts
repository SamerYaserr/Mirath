import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  HttpStatus,
  HttpCode,
  Query,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiQuery,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ReadingListsService } from './reading-lists.service';

import { IdDto } from 'src/common/dto/id.dto';
import { CreateReadingListReqDto } from './dtos/requests/create-reading-list.req.dto';
import { AddPaperReqDto } from './dtos/requests/add-paper.req.dto';
import { DeletePaperReqDto } from './dtos/requests/delete-paper.req.dto';
import { ReadingListOwnerIdReqDto } from './dtos/requests/owner-id.req.dto';
import {
  GetAllSystemReadingListsResDto,
  GetUserReadingListsResDto,
} from './dtos/responses/get-all-lists.res.dto';
import { CreatedListResDto } from './dtos/responses/create-reading-list.res.dto';
import { FindOneReadingListResDto } from './dtos/responses/find-one-reading-list.res.dto';
import { AddedPaperResDto } from './dtos/responses/add-paper.res.dto';
import {
  OwnerResDto,
  PaperDetailResDto,
  ReadingListPaperResDto,
} from './dtos/responses/shared.res.dto';
import { HttpResponse } from 'src/common/types/api.types';

@ApiTags('Reading Lists')
@ApiBearerAuth()
@ApiExtraModels(
  OwnerResDto,
  PaperDetailResDto,
  ReadingListPaperResDto,
  GetUserReadingListsResDto,
  GetAllSystemReadingListsResDto,
  CreatedListResDto,
  FindOneReadingListResDto,
  AddedPaperResDto,
)
@Controller('reading-lists')
export class ReadingListsController {
  constructor(private readonly readingListsService: ReadingListsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get reading lists',
    description:
      'Fetch reading lists for the current user or another user. ' +
      "If ownerId query parameter is provided, returns that user's PUBLIC lists only. " +
      'If ownerId is omitted, returns all lists (public and private) belonging to the current user. ' +
      'Each list includes a paper count and preview tags (top 3 unique categories from the first 5 papers).',
  })
  @ApiQuery({
    name: 'ownerId',
    required: false,
    description:
      "UUID of the user whose reading lists to fetch. If omitted, returns current user's lists.",
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Reading lists fetched successfully with paper count and preview tags.',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Reading lists fetched successfully',
        },
        size: { type: 'number', example: 1 },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(GetUserReadingListsResDto) },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  async findAll(
    @Req() req: Request,
    @Query() q: ReadingListOwnerIdReqDto,
  ): Promise<HttpResponse<GetUserReadingListsResDto[]>> {
    const userId = req.user!.id;
    const { ownerId } = q;
    return this.readingListsService.findAll(userId, ownerId);
  }

  @Get('all')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all reading lists in the database',
    description: 'Fetch all reading lists available in the system.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'All reading lists.',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'All reading lists fetched successfully',
        },
        size: { type: 'number', example: 1 },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(GetAllSystemReadingListsResDto) },
        },
      },
    },
  })
  async getAllLists(): Promise<HttpResponse<GetAllSystemReadingListsResDto[]>> {
    return this.readingListsService.getAllLists();
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new reading list' })
  @ApiBody({ type: CreateReadingListReqDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Create a new reading list.',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'The reading list has been successfully created.',
        },
        data: { $ref: getSchemaPath(CreatedListResDto) },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  async create(
    @Req() req: Request,
    @Body() createReadingListReqDto: CreateReadingListReqDto,
  ): Promise<HttpResponse<CreatedListResDto>> {
    const userId = req.user!.id;
    return this.readingListsService.create(userId, createReadingListReqDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a specific reading list' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the reading list with papers.',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Reading list fetched successfully',
        },
        data: { $ref: getSchemaPath(FindOneReadingListResDto) },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  @ApiNotFoundResponse({ description: 'Reading list not found.' })
  @ApiForbiddenResponse({
    description: 'Access to private reading list denied.',
  })
  async findOne(
    @Param() { id }: IdDto,
    @Req() req: Request,
  ): Promise<HttpResponse<FindOneReadingListResDto>> {
    const userId = req.user!.id;
    return this.readingListsService.findOne(id, userId);
  }

  @Post(':id/papers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a paper to a reading list' })
  @ApiBody({ type: AddPaperReqDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The paper has been added to the list.',
    schema: {
      properties: {
        message: { type: 'string', example: 'Paper saved successfully' },
        data: { $ref: getSchemaPath(AddedPaperResDto) },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  @ApiNotFoundResponse({ description: 'Reading list not found.' })
  @ApiForbiddenResponse({
    description: 'You can only modify your own reading lists',
  })
  @ApiConflictResponse({
    description: 'This paper is already in the reading list',
  })
  async addPaper(
    @Param() { id }: IdDto,
    @Body() addPaperReqDto: AddPaperReqDto,
    @Req() req: Request,
  ): Promise<HttpResponse<AddedPaperResDto>> {
    const userId = req.user!.id;
    return this.readingListsService.addPaper(
      id,
      addPaperReqDto.paperId,
      userId,
    );
  }

  @Delete(':id/papers/:paperId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a paper from a reading list' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The paper has been removed from the list.',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Paper removed from the reading list successfully',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  @ApiForbiddenResponse({
    description: 'You can only modify your own reading lists',
  })
  @ApiNotFoundResponse({
    description: 'Reading list not found OR Paper not found in the list.',
  })
  async removePaper(
    @Param() { id, paperId }: DeletePaperReqDto,
    @Req() req: Request,
  ): Promise<HttpResponse> {
    const userId = req.user!.id;
    return this.readingListsService.removePaper(id, paperId, userId);
  }
}
