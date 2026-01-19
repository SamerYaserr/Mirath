import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { ReadingListsService } from './reading-lists.service';
import { CreateReadingListDto } from './dtos/create-reading-list.dto';
import { AddPaperDto } from './dtos/add-paper.dto';

@ApiTags('Reading Lists')
@ApiBearerAuth()
@Controller('reading-lists')
export class ReadingListsController {
  constructor(private readonly readingListsService: ReadingListsService) {}

  @ApiOperation({ summary: 'Get all reading lists for current user' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return all reading lists belonging to the current logged-in user with paper count.' })
  @Get()
  async findAll(@Req() req: Request) {
    const userId = req.user!['id'];
    return this.readingListsService.findAll(userId);
  }

  @ApiOperation({ summary: 'Create a new reading list' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'The reading list has been successfully created.' })
  @Post()
  async create(@Req() req: Request, @Body() createReadingListDto: CreateReadingListDto) {
    const userId = req.user!['id'];
    return this.readingListsService.create(userId, createReadingListDto);
  }

  @ApiOperation({ summary: 'Get a specific reading list' })
  @ApiResponse({ status: HttpStatus.OK, description: 'Return the reading list with papers.' })
  @Get(':id')
  async findOne(@Param('id') id: string, @Req() req: Request) {
    const userId = req.user!['id'];
    return this.readingListsService.findOne(id, userId);
  }

  @ApiOperation({ summary: 'Add a paper to a reading list' })
  @ApiResponse({ status: HttpStatus.CREATED, description: 'The paper has been added to the list.' })
  @Post(':id/papers')
  async addPaper(
    @Param('id') id: string,
    @Body() addPaperDto: AddPaperDto,
    @Req() req: Request,
  ) {
    const userId = req.user!['id'];
    return this.readingListsService.addPaper(id, addPaperDto.paperId, userId);
  }

  @ApiOperation({ summary: 'Remove a paper from a reading list' })
  @ApiResponse({ status: HttpStatus.OK, description: 'The paper has been removed from the list.' })
  @Delete(':id/papers/:paperId')
  async removePaper(
    @Param('id') id: string,
    @Param('paperId') paperId: string,
    @Req() req: Request,
  ) {
    const userId = req.user!['id'];
    return this.readingListsService.removePaper(id, paperId, userId);
  }
}

