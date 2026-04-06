import { Injectable, NotFoundException } from '@nestjs/common';

import { SortOrder } from './dto/requests/get-saved-papers.req.dto';
import { HttpResponse } from 'src/common/types/api.types';
import { SavedPapersRepository } from '../papers/repositories/saved-papers.repository';
import { SavedPapersResDto } from './dto/responses/saved-paper-summary.res.dto';
import { ReadingHistoryRepository } from './repositories/reading-history.repository';
import { ReadingHistoryResDto } from './dto/responses/reading-history.res.dto';
import { PapersRepository } from '../papers/repositories/papers.repository';

@Injectable()
export class LibraryService {
  constructor(
    private savedPapersRepository: SavedPapersRepository,
    private readingHistoryRepository: ReadingHistoryRepository,
    private papersRepository: PapersRepository,
    
  ) {}

  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 10,
    sort: SortOrder = SortOrder.DESC,
  ): Promise<HttpResponse> {
    const skip = (page - 1) * limit;
    const papers = await this.savedPapersRepository.findAll(
      userId,
      skip,
      limit,
      sort,
    );

    return {
      size: papers.length,
      data: papers.map((paper) => SavedPapersResDto.fromEntity(paper)),
    };
  }

  async updateReadingHistory(userId: string, paperId: string): Promise<HttpResponse> {
    const paper = await this.papersRepository.find(paperId);
    if (!paper) {
      throw new NotFoundException('Paper not found');
    }
    await this.readingHistoryRepository.upsertHistory(userId, paperId);
    return { message: 'Reading history updated' };
  }

  async getReadingHistory(userId: string, page: number = 1, limit: number = 20): Promise<HttpResponse<ReadingHistoryResDto[]>> {
    const skip = (page - 1) * limit;
    const [size, data] = await this.readingHistoryRepository.findUserHistory(userId, skip, limit);
    return {
      size,
      data: data.map((item) => ReadingHistoryResDto.fromEntity(item)),
    };
  }

  async clearReadingHistory(userId: string): Promise<HttpResponse> {
    await this.readingHistoryRepository.deleteAllUserHistory(userId);
    return { message: 'Reading history cleared successfully' };
  }

  async removePaperFromHistory(userId: string, paperId: string): Promise<HttpResponse> {
    const history = await this.readingHistoryRepository.findHistory(userId, paperId);
    if (!history) {
      throw new NotFoundException('Reading history not found');
    }
    await this.readingHistoryRepository.removePaperFromHistory(userId, paperId);
    return { message: 'Paper removed from reading history' };
  }
}
