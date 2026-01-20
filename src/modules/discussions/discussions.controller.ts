import {
  Controller,
  Post,
  Body,
  Req,
  Get,
  Query,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import type { Request } from 'express';

import { IdDto } from 'src/common/dto/id.dto';
import { VoteTypeDto } from './dto/vote-type.dto';
import { DiscussionsService } from './discussions.service';
import { GetDiscussionsDto } from './dto/get-discussions.dto';
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('discussions')
export class DiscussionsController {
  constructor(private readonly discussionsService: DiscussionsService) {}

  @Post()
  create(
    @Body() createDiscussionDto: CreateDiscussionDto,
    @Req() req: Request,
  ) {
    const userId = req.user!.id;
    return this.discussionsService.create(createDiscussionDto, userId);
  }

  @Get()
  findAll(@Req() req: Request, @Query() q: GetDiscussionsDto) {
    const userId = req.user!.id;
    return this.discussionsService.findAll(q, userId);
  }

  @Get(':id')
  findOne(@Req() req: Request, @Param() { id }: IdDto) {
    const userId = req.user!.id;
    return this.discussionsService.findOne(id, userId);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  deleteOne(@Req() req: Request, @Param() { id }: IdDto) {
    const userId = req.user!.id;
    return this.discussionsService.deleteOne(id, userId);
  }

  @Post(':id/vote')
  vote(
    @Req() req: Request,
    @Param() { id }: IdDto,
    @Body() voteTypeDto: VoteTypeDto,
  ) {
    const userId = req.user!.id;
    const { type } = voteTypeDto;
    return this.discussionsService.vote(id, userId, type);
  }

  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id/vote')
  deleteVote(@Req() req: Request, @Param() { id }: IdDto) {
    const userId = req.user!.id;
    return this.discussionsService.deleteVote(id, userId);
  }

  @Post(':id/comments')
  createComment(
    @Req() req: Request,
    @Param() { id }: IdDto,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    const userId = req.user!.id;
    return this.discussionsService.createComment(userId, id, createCommentDto);
  }

  @Get(':id/comments')
  getDiscussionComments(@Req() req: Request, @Param() { id }: IdDto) {
    const userId = req.user!.id;
    return this.discussionsService.getDiscussionComments(userId, id);
  }
}
