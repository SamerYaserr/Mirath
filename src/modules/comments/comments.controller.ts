import { Body, Controller, HttpStatus, Param, Post, Req } from '@nestjs/common';
import { CommentsService } from './comments.service';
import { VoteTypeDto } from 'src/common/dto/vote-type.dto';
import type { Request } from 'express';
import { IdDto } from 'src/common/dto/id.dto';
import { ApiBody, ApiOperation, ApiResponse } from '@nestjs/swagger';

@Controller('comments')
export class CommentsController {
  constructor(private readonly commentsService: CommentsService) {}

  @ApiOperation({
    summary: 'Vote on a comment',
    description:
      'Up/down vote a comment. Changes vote if already voted differently',
  })
  @ApiBody({ type: VoteTypeDto })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Vote created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Already voted this way',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Comment not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @Post(':id/vote')
  vote(
    @Body() voteTypeDto: VoteTypeDto,
    @Req() req: Request,
    @Param() { id }: IdDto,
  ) {
    const userId = req.user!.id;
    const { type } = voteTypeDto;
    return this.commentsService.vote(userId, id, type);
  }
}
