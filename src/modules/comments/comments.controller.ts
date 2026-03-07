import {
  Body,
  Controller,
  Delete,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common';
import { CommentsService } from './comments.service';
import { VoteTypeDto } from 'src/common/dto/vote-type.dto';
import type { Request } from 'express';
import { IdDto } from 'src/common/dto/id.dto';
import {
  ApiBearerAuth,
  ApiBody,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';

@ApiTags('Comments')
@ApiBearerAuth()
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
    return this.commentsService.vote({ userId, commentId: id, type });
  }

  @ApiOperation({
    summary: 'Remove vote from a comment',
    description: "Removes the user's vote from a comment",
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Vote deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'User has not voted on this comment',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Authentication required',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id/vote')
  deleteVote(@Req() req: Request, @Param() { id }: IdDto) {
    const userId = req.user!.id;
    return this.commentsService.deleteVote(userId, id);
  }
}
