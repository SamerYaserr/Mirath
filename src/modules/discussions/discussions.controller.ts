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
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBody,
} from '@nestjs/swagger';
import type { Request } from 'express';

import { IdDto } from 'src/common/dto/id.dto';
import { VoteTypeDto } from './dtos/vote-type.dto';
import { DiscussionsService } from './discussions.service';
import { CreateCommentDto } from './dtos/create-comment.dto';
import { GetDiscussionsDto } from './dtos/get-discussions.dto';
import { CreateDiscussionDto } from './dtos/create-discussion.dto';

@Controller('discussions')
export class DiscussionsController {
  constructor(private readonly discussionsService: DiscussionsService) {}

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Create a new discussion',
    description:
      'Creates a new discussion with title, content, associated topics (interests), and optional papers',
  })
  @ApiBody({ type: CreateDiscussionDto })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Discussion created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Invalid input - validation error or non-existent topics/papers',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - authentication required',
  })
  @Post()
  create(
    @Body() createDiscussionDto: CreateDiscussionDto,
    @Req() req: Request,
  ) {
    const userId = req.user!.id;
    return this.discussionsService.create(createDiscussionDto, userId);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all discussions',
    description:
      'Retrieves all discussions with pagination, sorting, and optional filtering by topic',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Successfully retrieved discussions',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid query parameters',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - authentication required',
  })
  @Get()
  findAll(@Req() req: Request, @Query() q: GetDiscussionsDto) {
    const userId = req.user!.id;
    return this.discussionsService.findAll(q, userId);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get a specific discussion',
    description: 'Retrieves a single discussion by ID with all related data',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The discussion ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Discussion retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Discussion not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - authentication required',
  })
  @Get(':id')
  findOne(@Req() req: Request, @Param() { id }: IdDto) {
    const userId = req.user!.id;
    return this.discussionsService.findOne(id, userId);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a discussion',
    description:
      'Deletes a specific discussion. Only the author can delete their own discussions',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The discussion ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Discussion deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Discussion not found',
  })
  @ApiResponse({
    status: HttpStatus.FORBIDDEN,
    description: 'You are only allowed to delete your own discussions',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - authentication required',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id')
  deleteOne(@Req() req: Request, @Param() { id }: IdDto) {
    const userId = req.user!.id;
    return this.discussionsService.deleteOne(id, userId);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Vote on a discussion',
    description:
      'Creates or updates a vote on a discussion (up or down). Changes vote if already voted',
  })
  @ApiBody({ type: VoteTypeDto })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The discussion ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Vote created successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Invalid vote type or already voted this way on this discussion',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Discussion not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - authentication required',
  })
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

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Delete a vote on a discussion',
    description: 'Removes the user vote from a specific discussion',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The discussion ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Vote deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'No vote found for this discussion',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - authentication required',
  })
  @HttpCode(HttpStatus.NO_CONTENT)
  @Delete(':id/vote')
  deleteVote(@Req() req: Request, @Param() { id }: IdDto) {
    const userId = req.user!.id;
    return this.discussionsService.deleteVote(id, userId);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Post a comment on a discussion',
    description:
      'Creates a new comment on a discussion. Supports nested comments by providing a parentId',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The discussion ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Comment posted successfully',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description:
      'Invalid input or parent comment does not belong to this discussion',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Discussion or parent comment not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - authentication required',
  })
  @Post(':id/comments')
  createComment(
    @Req() req: Request,
    @Param() { id }: IdDto,
    @Body() createCommentDto: CreateCommentDto,
  ) {
    const userId = req.user!.id;
    return this.discussionsService.createComment(userId, id, createCommentDto);
  }

  @ApiBearerAuth()
  @ApiOperation({
    summary: 'Get all comments for a discussion',
    description:
      'Retrieves all comments for a specific discussion, including nested replies',
  })
  @ApiParam({
    name: 'id',
    type: String,
    description: 'The discussion ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Comments retrieved successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Discussion not found',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized - authentication required',
  })
  @Get(':id/comments')
  getDiscussionComments(@Req() req: Request, @Param() { id }: IdDto) {
    const userId = req.user!.id;
    return this.discussionsService.getDiscussionComments(userId, id);
  }
}
