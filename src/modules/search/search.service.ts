import { Injectable, NotFoundException } from '@nestjs/common';

import { HttpResponse } from 'src/common/types/api.types';
import { SearchHistoryRepository } from './repositories/search-history.repository';
import { SearchRepository } from './repositories/search.repository';

@Injectable()
export class SearchService {
  constructor(
    private searchHistoryRepo: SearchHistoryRepository,
    private searchRepository: SearchRepository,
  ) {}

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

  async searchGlobal(
    userId: string,
    query: string,
    page: number,
    limit: number,
  ): Promise<HttpResponse> {
    const skip = (page - 1) * limit;

    const [discussions, readingLists, researchers] = await Promise.all([
      this.searchRepository.searchDiscussions(userId, query, skip, limit),
      this.searchRepository.searchReadingLists(userId, query, skip, limit),
      this.searchRepository.searchResearchers(userId, query, skip, limit),
    ]);

    await this.searchHistoryRepo.create(userId, query);

    return {
      message: 'Global search results retrieved successfully',
      data: {
        discussions: this.mapDiscussions(discussions, userId),
        readingLists: this.mapReadingLists(readingLists, userId),
        researchers: this.mapResearchers(researchers),
      },
    };
  }

  async searchDiscussions(
    userId: string,
    query: string,
    page: number,
    limit: number,
  ): Promise<HttpResponse> {
    const skip = (page - 1) * limit;
    const discussions = await this.searchRepository.searchDiscussions(
      userId,
      query,
      skip,
      limit,
    );

    return {
      message: 'Discussion search results retrieved successfully',
      data: this.mapDiscussions(discussions, userId),
    };
  }

  async searchReadingLists(
    userId: string,
    query: string,
    page: number,
    limit: number,
  ): Promise<HttpResponse> {
    const skip = (page - 1) * limit;
    const lists = await this.searchRepository.searchReadingLists(
      userId,
      query,
      skip,
      limit,
    );

    return {
      message: 'Reading List search results retrieved successfully',
      data: this.mapReadingLists(lists, userId),
    };
  }

  async searchResearchers(
    currentUserId: string,
    query: string,
    page: number,
    limit: number,
  ): Promise<HttpResponse> {
    const skip = (page - 1) * limit;
    const users = await this.searchRepository.searchResearchers(
      currentUserId,
      query,
      skip,
      limit,
    );

    return {
      message: 'Researcher search results retrieved successfully',
      data: this.mapResearchers(users),
    };
  }

  // ========== Helpers ========== //

  private async checkSearchQueryExistance(id: string, userId: string) {
    if (!(await this.searchHistoryRepo.exist(id, userId)))
      throw new NotFoundException('No search query found with this id');
  }

  // Data Mappers to ensure UI-friendly structure

  private mapDiscussions(
    discussions: Awaited<ReturnType<SearchRepository['searchDiscussions']>>,
    currentUserId: string,
  ) {
    return discussions.map((d) => ({
      ...d,
      tags: d.topics.map((t) => t.interest.name),
      topics: undefined,
      author: {
        ...d.author,
        isMe: d.author.id === currentUserId,
        isFollowing: d.author.followers.length > 0,
        followers: undefined,
      },
    }));
  }

  private mapReadingLists(
    lists: Awaited<ReturnType<SearchRepository['searchReadingLists']>>,
    currentUserId: string,
  ) {
    return lists.map((l) => ({
      ...l,
      paperCount: l._count.papers,
      isSaved: l.savedReadingLists?.length > 0 || false,
      owner: {
        ...l.owner,
        isMe: l.owner.id === currentUserId,
        isFollowing: l.owner.followers.length > 0,
        followers: undefined,
      },
      _count: undefined,
      savedReadingLists: undefined,
    }));
  }

  private mapResearchers(
    users: Awaited<ReturnType<SearchRepository['searchResearchers']>>,
  ) {
    return users.map((u) => ({
      ...u,
      isFollowing: u.followers.length > 0,
      followers: undefined,
    }));
  }
}
