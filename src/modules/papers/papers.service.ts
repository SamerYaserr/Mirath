import { Injectable } from '@nestjs/common';
import { PapersRepository } from './repositories/papers.repository';
import { SearchPaperDto } from './dto/search-paper.dto';
import { HttpResponse } from 'src/common/types/api.types';

@Injectable()
export class PapersService {
  constructor(private readonly papersRepository: PapersRepository) {}

  async search(
    userId: string,
    searchDto: SearchPaperDto,
  ): Promise<HttpResponse> {
    const { q, page, limit } = searchDto;
    const offset = (page - 1) * limit;

    const papers = await this.papersRepository.searchPapers(
      userId,
      q,
      limit,
      offset,
    );

    if (papers.length > 0) this.papersRepository.createSearchHistory(userId, q);

    return {
      message:
        papers.length > 0
          ? 'Search results retrieved successfully'
          : 'No results found',
      data: papers,
      size: papers.length,
    };
  }
}
