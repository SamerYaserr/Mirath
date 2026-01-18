import { Controller, Post, Body, Req } from '@nestjs/common';
import { DiscussionsService } from './discussions.service';
import { CreateDiscussionDto } from './dto/create-discussion.dto';
import type { Request } from 'express';

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
}
