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
  Patch,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
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
import { GetUserSavedListsResDto } from './dtos/responses/get-saved-lists.res.dto';
import { UpdateReadingListReqDto } from './dtos/requests/update.req.dto';
import { GetReadingListsQueryReqDto } from './dtos/requests/get-reading-lists-query.req.dto';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@ApiTags('Reading Lists')
@ApiBearerAuth()
@ApiExtraModels(
  OwnerResDto,
  PaperDetailResDto,
  ReadingListPaperResDto,
  GetUserReadingListsResDto,
  GetUserSavedListsResDto,
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
      'Fetch reading lists for the current user or another user.\n\n' +
      "- **saved=true** — returns the current user's saved (bookmarked) lists. " +
      'Cannot be combined with `ownerId`.\n' +
      "- **ownerId provided** — returns that user's PUBLIC lists only.\n" +
      '- **neither** — returns all lists (public and private) belonging to the current user.',
  })
  @ApiQuery({
    name: 'ownerId',
    required: false,
    description:
      "UUID of the user whose reading lists to fetch. If omitted, returns current user's lists. Cannot be combined with saved=true.",
    type: String,
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiQuery({
    name: 'saved',
    required: false,
    description:
      "Set to true to fetch the current user's saved (bookmarked) reading lists. Cannot be combined with ownerId.",
    type: Boolean,
    example: true,
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'Reading lists fetched successfully with paper count and preview tags. ' +
      'Returns GetUserSavedListsResDto[] when saved=true, otherwise GetUserReadingListsResDto[].',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Reading lists fetched successfully',
        },
        size: { type: 'number', example: 1 },
        data: {
          type: 'array',
          items: {
            oneOf: [
              { $ref: getSchemaPath(GetUserReadingListsResDto) },
              { $ref: getSchemaPath(GetUserSavedListsResDto) },
            ],
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Cannot use saved=true and ownerId at the same time.',
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  async findAll(
    @Req() req: Request,
    @Query() q: GetReadingListsQueryReqDto,
  ): Promise<
    HttpResponse<GetUserReadingListsResDto[] | GetUserSavedListsResDto[]>
  > {
    const userId = req.user!.id;
    const { ownerId, saved, skip = 0, limit = 10 } = q;
    return this.readingListsService.findAll(
      userId,
      skip,
      limit,
      ownerId,
      saved,
    );
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
  async getAllLists(
    @Query() q: PaginationDto,
  ): Promise<HttpResponse<GetAllSystemReadingListsResDto[]>> {
    return this.readingListsService.getAllLists(q);
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

  @Patch(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Update a reading list' })
  @ApiBody({ type: UpdateReadingListReqDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Reading list updated successfully',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Reading list updated successfully',
        },
        data: { $ref: getSchemaPath(CreatedListResDto) },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  @ApiNotFoundResponse({ description: 'Reading list not found' })
  @ApiForbiddenResponse({
    description: 'You can only modify your own reading lists',
  })
  async Update(
    @Req() req: Request,
    @Param() { id }: IdDto,
    @Body() dto: UpdateReadingListReqDto,
  ): Promise<HttpResponse<CreatedListResDto>> {
    const userId = req.user!.id;
    return this.readingListsService.update({ id, userId, data: dto });
  }

  @Post(':id/save')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Save a reading list',
    description:
      'Save a public reading list to your saved lists. ' +
      'User cannot save his own lists or private lists.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The reading list has been saved successfully.',
    schema: {
      properties: {
        message: { type: 'string', example: 'List saved successfully.' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  @ApiNotFoundResponse({ description: 'Reading list not found.' })
  @ApiForbiddenResponse({ description: 'You cannot save a private list.' })
  @ApiBadRequestResponse({ description: 'You cannot save your own list.' })
  async save(
    @Param() { id }: IdDto,
    @Req() req: Request,
  ): Promise<HttpResponse> {
    const userId = req.user!.id;
    return this.readingListsService.save(id, userId);
  }

  @Delete(':id/save')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete a saved reading list',
    description: "Unsave a saved reading list from user's profile.",
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The reading list has been unsaved successfully.',
    schema: {
      properties: {
        message: { type: 'string', example: 'List unsaved successfully.' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  @ApiNotFoundResponse({ description: 'You have not saved this list.' })
  async unsave(
    @Param() { id }: IdDto,
    @Req() req: Request,
  ): Promise<HttpResponse> {
    const userId = req.user!.id;
    return this.readingListsService.unsave(id, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a reading list' })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  @ApiNotFoundResponse({ description: 'Reading list not found' })
  @ApiForbiddenResponse({
    description: 'You can only modify your own reading lists',
  })
  async delete(@Req() req: Request, @Param() { id }: IdDto) {
    const userId = req.user!.id;
    return this.readingListsService.delete(id, userId);
  }
}
