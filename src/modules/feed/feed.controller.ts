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
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';
import type { Request } from 'express';
import { FeedService } from './feed.service';
import { FeedQueryDto } from './dto/FeedQuery.dto';
import { RecommendationQueryDto } from './dto/RecommendationQuery.dto';

@ApiTags('Feed')
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
    status: 200,
    description: 'Recent papers retrieved successfully.',
    schema: {
      example: {
        message: 'Recent papers fetched successfully',
        size: 2,
        data: [
          {
            id: '3f1e8d6a-9a45-4f2a-8a8a-1b9c9a8e1111',
            title: 'Artificial Intelligence in Healthcare',
            abstract:
              'This paper explores the impact of AI in modern healthcare systems.',
            publishedAt: '2026-01-10T12:00:00.000Z',
            authors: ['John Doe', 'Jane Smith'],
            categories: ['AI', 'Healthcare'],
            isSaved: true,
          },
          {
            id: '8b2c4a1d-7d21-44f6-9c4a-2e9a0c222222',
            title: 'Deep Learning Advances',
            abstract: 'A survey of recent advances in deep learning.',
            publishedAt: '2026-01-08T09:30:00.000Z',
            authors: ['Alan Turing'],
            categories: ['AI'],
            isSaved: false,
          },
        ],
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
    status: 200,
    description: 'Recommendations retrieved successfully.',
    schema: {
      example: {
        message: 'Recommendations fetched successfully',
        size: 1,
        data: [
          {
            id: 'c1a9d9f1-4b21-4b99-8d22-777777777777',
            title: 'Neural Networks Explained',
            abstract: 'An introduction to neural networks.',
            publishedAt: '2026-01-05T08:00:00.000Z',
            authors: ['Geoffrey Hinton'],
            categories: ['AI', 'Neural Networks'],
            isSaved: false,
          },
        ],
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
