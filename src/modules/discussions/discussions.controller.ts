import { Controller, Post, Body, Req, Get, Query } from '@nestjs/common';
import { DiscussionsService } from './discussions.service';
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import type { Request } from 'express';
import { GetDiscussionsDto } from './dto/get-discussions.dto';

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
}
