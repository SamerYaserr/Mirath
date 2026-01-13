import { Injectable, NotFoundException } from '@nestjs/common';
import { FeedRepository } from './repositories/feed.repository';
import { FeedQueryDto, RecommendationQueryDto } from './dto/feed.dto';
import { HttpResponse } from '../../common/types/api.types';

@Injectable()
export class FeedService {
  constructor(private readonly repo: FeedRepository) {}

  async getRecent(userId: string, dto: FeedQueryDto): Promise<HttpResponse> {
    const { category, page = 1, limit = 10 } = dto;
    const offset = (page - 1) * limit;

    const { papers } = await this.repo.findRecentPapers({
      category: category ?? undefined,
      limit,
      offset,
    });

    const paperIds = papers.map((p) => p.id);
    const savedIds = await this.repo.findSavedPaperIdsForUser({
      userId,
      paperIds,
    });

    const savedSet = new Set(savedIds);

    const data = papers.map((p) => ({
      ...p,
      isSaved: savedSet.has(p.id),
    }));

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

    const user = await this.repo.findUserForRecommendations(userId);
    if (!user) throw new NotFoundException('User not found');

    const interestNames = user.userInterests.map((ui) => ui.interest.name);
    const fieldNames = user.userFields.map((uf) => uf.field.name);
    const tags = [...new Set([...interestNames, ...fieldNames])];
    const savedPaperIds = user.savedPapers.map((sp) => sp.paperId);

    if (tags.length === 0) {
      return {
        message: 'No interests found for recommendations',
        data: [],
        size: 0,
      };
    }

    const { papers } = await this.repo.findRecommendationPapers({
      tags,
      excludePaperIds: savedPaperIds,
      limit,
      offset,
    });

    const data = papers.map((p) => ({
      ...p,
      isSaved: false,
    }));

    return {
      message: 'Recommendations fetched successfully',
      data,
      size: data.length,
    };
  }
}
