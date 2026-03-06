import { Injectable, NotFoundException } from '@nestjs/common';

import { HttpResponse } from 'src/common/types/api.types';
import { SearchHistoryRepository } from './repositories/search-history.repository';
import { SearchRepository } from './repositories/search.repository';
import { SearchHistoryEntryResDto } from './dto/responses/shared.res.dto';
import { GlobalSearchResDto } from './dto/responses/search-global.res.dto';
import { DiscussionSearchResDto } from './dto/responses/search-discussions.res.dto';
import { ReadingListSearchResDto } from './dto/responses/search-reading-lists.res.dto';
import { ResearcherSearchResDto } from './dto/responses/search-researchers.res.dto';

@Injectable()
export class SearchService {
  constructor(
    private searchHistoryRepo: SearchHistoryRepository,
    private searchRepository: SearchRepository,
  ) {}

  async deleteSearchQuery(
    id: string,
    userId: string,
  ): Promise<HttpResponse<null>> {
    await this.checkSearchQueryExistence(id, userId);
    await this.searchHistoryRepo.deleteById(id);

    return {
      message: 'Search Query deleted successfully',
    };
  }

  async deleteAll(userId: string): Promise<HttpResponse<null>> {
    await this.searchHistoryRepo.delete(userId);

    return {
      message: 'Search history deleted successfully',
    };
  }

  async getSearchHistory(
    userId: string,
    limit: number,
  ): Promise<HttpResponse<SearchHistoryEntryResDto[]>> {
    const searchHistory = await this.searchHistoryRepo.find(userId, limit);

    return {
      message: 'Search history retrieved successfully',
      size: searchHistory.length,
      data: searchHistory.map(SearchHistoryEntryResDto.fromRecord),
    };
  }

  async searchGlobal(
    userId: string,
    query: string,
    page: number,
    limit: number,
  ): Promise<HttpResponse<GlobalSearchResDto>> {
    const skip = (page - 1) * limit;

    const [discussions, readingLists, researchers] = await Promise.all([
      this.searchRepository.searchDiscussions(userId, query, skip, limit),
      this.searchRepository.searchReadingLists(userId, query, skip, limit),
      this.searchRepository.searchResearchers(userId, query, skip, limit),
    ]);

    await this.searchHistoryRepo.create(userId, query);

    return {
      message: 'Global search results retrieved successfully',
      data: GlobalSearchResDto.fromParts(
        discussions.map((d) => DiscussionSearchResDto.fromResult(d, userId)),
        readingLists.map((l) => ReadingListSearchResDto.fromResult(l, userId)),
        researchers.map(ResearcherSearchResDto.fromResult),
      ),
    };
  }

  async searchDiscussions(
    userId: string,
    query: string,
    page: number,
    limit: number,
  ): Promise<HttpResponse<DiscussionSearchResDto[]>> {
    const skip = (page - 1) * limit;
    const results = await this.searchRepository.searchDiscussions(
      userId,
      query,
      skip,
      limit,
    );

    return {
      message: 'Discussion search results retrieved successfully',
      data: results.map((d) => DiscussionSearchResDto.fromResult(d, userId)),
    };
  }

  async searchReadingLists(
    userId: string,
    query: string,
    page: number,
    limit: number,
  ): Promise<HttpResponse<ReadingListSearchResDto[]>> {
    const skip = (page - 1) * limit;
    const results = await this.searchRepository.searchReadingLists(
      userId,
      query,
      skip,
      limit,
    );

    return {
      message: 'Reading List search results retrieved successfully',
      data: results.map((l) => ReadingListSearchResDto.fromResult(l, userId)),
    };
  }

  async searchResearchers(
    currentUserId: string,
    query: string,
    page: number,
    limit: number,
  ): Promise<HttpResponse<ResearcherSearchResDto[]>> {
    const skip = (page - 1) * limit;
    const results = await this.searchRepository.searchResearchers(
      currentUserId,
      query,
      skip,
      limit,
    );

    return {
      message: 'Researcher search results retrieved successfully',
      data: results.map(ResearcherSearchResDto.fromResult),
    };
  }

  // ========== Helpers ========== //

  private async checkSearchQueryExistence(
    id: string,
    userId: string,
  ): Promise<void> {
    if (!(await this.searchHistoryRepo.exist(id, userId)))
      throw new NotFoundException('No search query found with this id');
  }
}
