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

    const { papers, total } = await this.repo.findRecentPapers({
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
      size: total,
    };

  }
}
