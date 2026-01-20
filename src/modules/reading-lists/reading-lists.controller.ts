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
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiBody,
  ApiConflictResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { ReadingListsService } from './reading-lists.service';
import { CreateReadingListDto } from './dtos/create-reading-list.dto';
import { AddPaperDto } from './dtos/add-paper.dto';
import { IdDto } from 'src/common/dto/id.dto';
import { DeletePaperDto } from './dtos/delete-paper.dto';

@ApiTags('Reading Lists')
@ApiBearerAuth()
@Controller('reading-lists')
export class ReadingListsController {
  constructor(private readonly readingListsService: ReadingListsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get all reading lists for current user',
    description:
      'Fetch all reading lists belonging to the current logged-in user with paper count, sorted in descending order by creation.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description:
      'all reading lists belonging to the current user with paper count.',
    schema: {
      example: {
        message: 'Reading lists fetched successfully',
        data: [
          {
            id: 'c1a9d9f1-4b21-4b99-8d22-347799777555',
            title: 'Neural Networks Papers',
            description: 'A collection of must-read neural networks papers.',
            isPublic: false,
            ownerId: 't4gvmte3-pppe-4crf-r333-9qfeqq15q7qq',
            createdAt: '2026-01-19T18:39:07.379Z',
            updatedAt: '2026-01-19T18:39:07.379Z',
            _count: { papers: 15 },
          },
        ],
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  async findAll(@Req() req: Request) {
    const userId = req.user!['id'];
    return this.readingListsService.findAll(userId);
  }

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new reading list' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Create a new reading list.',
    schema: {
      example: {
        message: 'The reading list has been successfully created.',
        data: {
          id: 'c1a9d9f1-4b21-4b99-8d22-347799777555',
          title: 'Neural Networks Papers',
          description: 'A collection of must-read neural networks papers.',
          isPublic: false,
          ownerId: 't4gvmte3-pppe-4crf-r333-9qfeqq15q7qq',
          createdAt: '2026-01-19T18:39:07.379Z',
          updatedAt: '2026-01-19T18:39:07.379Z',
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  async create(
    @Req() req: Request,
    @Body() createReadingListDto: CreateReadingListDto,
  ) {
    const userId = req.user!['id'];
    return this.readingListsService.create(userId, createReadingListDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Get a specific reading list' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Return the reading list with papers.',
    schema: {
      example: {
        message: 'Reading list fetched successfully',
        data: {
          id: 'c1a9d9f1-4b21-4b99-8d22-347799777555',
          title: 'Neural Networks Papers',
          description: 'A collection of must-read neural networks papers.',
          isPublic: false,
          ownerId: 't4gvmte3-pppe-4crf-r333-9qfeqq15q7qq',
          createdAt: '2026-01-19T18:39:07.379Z',
          updatedAt: '2026-01-19T18:39:07.379Z',
          papers: [
            {
              readingListId: 'c1a9d9f1-4b21-4b99-8d22-347799777555',
              paperId: 'p1q2r3s4-t5u6-v7w8-x9y0-z1234567890a',
              paper: {
                id: 'p1q2r3s4-t5u6-v7w8-x9y0-z1234567890a',
                title: 'Deep Learning in Neural Networks: An Overview',
                abstract: 'This paper provides an overview of deep learning...',
                citation: 'Citation 2025',
                authors: ['J. Schmidhuber'],
                categories: ['...'],
                publishedAt: '2025-05-15T00:00:00.000Z',
              },
            },
          ],
          owner: {
            id: 't4gvmte3-pppe-4crf-r333-9qfeqq15q7qq',
            username: 'researcher123',
            fullName: 'Jane Doe',
          },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  @ApiNotFoundResponse({ description: 'Reading list not found.' })
  @ApiForbiddenResponse({
    description: 'Access to private reading list denied.',
  })
  async findOne(@Param() { id }: IdDto, @Req() req: Request) {
    const userId = req.user!['id'];
    return this.readingListsService.findOne(id, userId);
  }

  @Post(':id/papers')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add a paper to a reading list' })
  @ApiBody({ type: AddPaperDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The paper has been added to the list.',
    schema: {
      example: {
        message: 'Paper saved successfully',
        data: {
          readingListId: 'c1a9d9f1-4b21-4b99-8d22-347799777555',
          paperId: 'p1q2r3s4-t5u6-v7w8-x9y0-z1234567890a',
        },
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
    @Body() addPaperDto: AddPaperDto,
    @Req() req: Request,
  ) {
    const userId = req.user!['id'];
    return this.readingListsService.addPaper(id, addPaperDto.paperId, userId);
  }

  @Delete(':id/papers/:paperId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Remove a paper from a reading list' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The paper has been removed from the list.',
    schema: {
      example: {
        message: 'Paper removed from the reading list successfully',
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  @ApiNotFoundResponse({ description: 'Reading list not found.' })
  @ApiForbiddenResponse({
    description: 'You can only modify your own reading lists',
  })
  async removePaper(
    @Param() { id, paperId }: DeletePaperDto,
    @Req() req: Request,
  ) {
    const userId = req.user!['id'];
    return this.readingListsService.removePaper(id, paperId, userId);
  }
}
