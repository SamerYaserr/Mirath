import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';
import { HttpResponse } from '../../common/types/api.types';
import { FeedRepository } from './repositories/feed.repository';
import { FeedQueryDto } from './dto/requests/FeedQuery.req.dto';
import { FeedPaperResDto } from './dto/responses/feed-paper.res.dto';
import { RecommendationQueryDto } from './dto/requests/RecommendationQuery.req.dto';

@Injectable()
export class FeedService {
  constructor(
    private readonly repo: FeedRepository,
    private readonly prisma: PrismaService,
  ) {}

  async getRecent(userId: string, dto: FeedQueryDto): Promise<HttpResponse> {
    const { category, page = 1, limit = 10 } = dto;
    const offset = (page - 1) * limit;

    const userSettings = await this.prisma.userSettings.findUnique({
      where: { userId },
    });
    const hideAlreadyReadPapers = userSettings?.hideAlreadyReadPapers ?? false;

    let excludeIds: string[] | undefined;
    if (hideAlreadyReadPapers) {
      excludeIds = await this.repo.findReadPaperIds(userId);
    }

    const { papers } = await this.repo.findRecentPapers({
      category: category ?? undefined,
      limit,
      offset,
      ...(excludeIds && { excludeIds }),
    });

    const paperIds = papers.map((p) => p.id);
    const savedIds = await this.repo.findSavedPaperIdsForUser({
      userId,
      paperIds,
    });

    const savedSet = new Set(savedIds);

    const data = papers.map((p) =>
      FeedPaperResDto.fromEntity({ ...p, isSaved: savedSet.has(p.id) }),
    );

    return {
      message: 'Recent papers fetched successfully',
      data,
      size: data.length,
    };
  }

  async getRecommendations(
    userId: string,
    dto: RecommendationQueryDto,
  ): Promise<HttpResponse> {
    const { page = 1, limit = 5 } = dto;
    const offset = (page - 1) * limit;

    const userSettings = await this.prisma.userSettings.findUnique({
      where: { userId },
      include: { recommendationInterests: { include: { interest: true } } },
    });
    const showRecommendedPapers = userSettings?.showRecommendedPapers ?? true;
    const hideAlreadyReadPapers = userSettings?.hideAlreadyReadPapers ?? false;

    if (!showRecommendedPapers) {
      return {
        message: 'Recommendations is disabled',
        data: [],
        size: 0,
      };
    }

    const tags = userSettings?.recommendationInterests.map((ri: any) => ri.interest.name) || [];

    if (tags.length === 0) {
      return {
        message: 'No interests found for recommendations',
        data: [],
        size: 0,
      };
    }

    let excludeIds: string[] | undefined;
    if (hideAlreadyReadPapers) {
      excludeIds = await this.repo.findReadPaperIds(userId);
    }

    const { papers } = await this.repo.findRecommendationPapers({
      tags,
      limit,
      offset,
      userId,
      ...(excludeIds && { excludeIds }),
    });

    const data = papers.map((p) =>
      FeedPaperResDto.fromEntity({ ...p, isSaved: false }),
    );

    return {
      message: 'Recommendations fetched successfully',
      data,
      size: data.length,
    };
  }
}
