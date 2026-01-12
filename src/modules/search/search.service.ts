import { Injectable, NotFoundException } from '@nestjs/common';

import { HttpResponse } from 'src/common/types/api.types';
import { SearchHistoryRepository } from './repositories/search-history.repository';

@Injectable()
export class SearchService {
  constructor(private searchHistoryRepo: SearchHistoryRepository) {}

  async deleteSearchQuery(id: string, userId: string): Promise<HttpResponse> {
    await this.checkSearchQueryExistance(id, userId);
    await this.searchHistoryRepo.deleteById(id);

    return {
      message: 'Search Query deleted successfully',
    };
  }

  async deleteAll(userId: string): Promise<HttpResponse> {
    await this.searchHistoryRepo.delete(userId);

    return {
      message: 'Search history deleted successfully',
    };
  }

  async getSearchHistory(userId: string, limit: number): Promise<HttpResponse> {
    const searchHistory = await this.searchHistoryRepo.find(userId, limit);

    return {
      size: searchHistory.length,
      data: searchHistory,
    };
  }

  // ========== Helpers ========== //

  private async checkSearchQueryExistance(id: string, userId: string) {
    if (!(await this.searchHistoryRepo.exist(id, userId)))
      throw new NotFoundException('No search query found with this id');
  }
}
