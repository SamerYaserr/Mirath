import {
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiExtraModels,
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
  getSchemaPath,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { FeedService } from './feed.service';
import { FeedQueryDto } from './dto/requests/FeedQuery.req.dto';
import { RecommendationQueryDto } from './dto/requests/RecommendationQuery.req.dto';
import { FeedPaperResDto } from './dto/responses/feed-paper.res.dto';

@ApiTags('Feed')
@ApiExtraModels(FeedPaperResDto)
@Controller('feed')
export class FeedController {
  constructor(private readonly feedService: FeedService) {}

  @Get('recent')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get recently published papers',
    description:
      'Fetches papers sorted by publication date. Supports pagination and category filtering.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recent papers retrieved successfully.',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Recent papers fetched successfully',
        },
        size: { type: 'number', example: 1 },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(FeedPaperResDto) },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  async getRecent(@Req() req: Request, @Query() query: FeedQueryDto) {
    const userId = req.user!.id;
    return this.feedService.getRecent(userId, query);
  }

  @Get('recommendations')
  @ApiBearerAuth()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get personalized recommendations',
    description:
      'Fetches papers matching user interests/fields. Excludes saved papers.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Recommendations retrieved successfully.',
    schema: {
      properties: {
        message: {
          type: 'string',
          example: 'Recommendations fetched successfully',
        },
        size: { type: 'number', example: 1 },
        data: {
          type: 'array',
          items: { $ref: getSchemaPath(FeedPaperResDto) },
        },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'User not logged in.' })
  async getRecommendations(
    @Req() req: Request,
    @Query() query: RecommendationQueryDto,
  ) {
    const userId = req.user!.id;
    return this.feedService.getRecommendations(userId, query);
  }
}
