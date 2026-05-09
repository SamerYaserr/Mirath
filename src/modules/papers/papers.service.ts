import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { firstValueFrom } from 'rxjs';
import { Prisma } from '@prisma/client';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';

import { AppConfig } from 'src/config/configuration';
import { HttpResponse } from 'src/common/types/api.types';
import { winstonLogger as logger } from 'src/config/logger.config';
import { PapersRepository } from './repositories/papers.repository';
import { SearchPaperReqDto } from './dto/requests/search-paper.req.dto';
import { SearchHistoryRepository } from '../search/repositories/search-history.repository';
import { PaperResDto } from './dto/responses/paper.res.dto';
import { SavedPaperResDto } from './dto/responses/saved-paper.res.dto';
import { SearchResultResDto } from './dto/responses/search-result.res.dto';
import { SearchInPaperResDto } from './dto/responses/search-in-paper.res.dto';
import { SavedPapersRepository } from './repositories/saved-papers.repository';
import { PaperCategoriesReqDto } from './dto/requests/paper-categories.req.dto';
import { PaperCategoryResDto } from './dto/responses/paper-category.res.dto';

type SearchReqBody = {
  question: string;
  limit: number;
};

@Injectable()
export class PapersService {
  constructor(
    private httpService: HttpService,
    private configService: ConfigService<AppConfig, true>,
    private papersRepository: PapersRepository,
    private savedPapersRepository: SavedPapersRepository,
    private searchHistoryRepository: SearchHistoryRepository,
  ) {}

  async savePaper(
    paperId: string,
    userId: string,
  ): Promise<HttpResponse<SavedPaperResDto>> {
    const paper = await this.papersRepository.find(paperId);
    if (!paper) throw new NotFoundException('No paper found with this id');

    try {
      const savedPaper = await this.savedPapersRepository.create(
        paperId,
        userId,
      );
      return {
        message: 'Paper saved successfully',
        data: SavedPaperResDto.fromEntity(savedPaper),
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('This paper is already saved');
      }
      throw error;
    }
  }

  async deleteSavedPaper(
    paperId: string,
    userId: string,
  ): Promise<HttpResponse<null>> {
    const paper = await this.papersRepository.find(paperId);
    if (!paper) throw new NotFoundException('No paper found with this id');

    try {
      await this.savedPapersRepository.delete(paperId, userId);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('This paper was not in your saved list');
      }
      throw error;
    }
    return { message: 'Paper deleted successfully' };
  }

  async search(
    userId: string,
    searchDto: SearchPaperReqDto,
  ): Promise<HttpResponse<SearchResultResDto[]>> {
    const { q, page, limit } = searchDto;
    const offset = (page - 1) * limit;

    const [externalResult, ftsResult] = await Promise.allSettled([
      this.searchExternal(q, limit),
      this.papersRepository.searchPapers(userId, q, limit, offset),
    ]);

    let papers;

    if (
      externalResult.status === 'fulfilled' &&
      externalResult.value.length > 0
    ) {
      // External Search done as intended\
      papers = await this.papersRepository.findMany(externalResult.value);
    } else {
      if (externalResult.status === 'rejected')
        logger.error('External search API failed', externalResult.reason);

      papers = ftsResult.status === 'fulfilled' ? ftsResult.value : [];
    }

    if (papers.length > 0) void this.searchHistoryRepository.create(userId, q);

    return {
      message:
        papers.length > 0
          ? 'Search results retrieved successfully'
          : 'No results found',
      data: papers.map((paper) => SearchResultResDto.fromEntity(paper)),
      size: papers.length,
    };
  }

  async find(paperId: string): Promise<HttpResponse<PaperResDto>> {
    const paper = await this.papersRepository.findDetailed(paperId);
    if (!paper) throw new NotFoundException('No paper found with this id');

    return {
      data: PaperResDto.fromEntity(paper),
    };
  }

  async searchInPaper(
    paperId: string,
    q: string,
  ): Promise<SearchInPaperResDto> {
    const paper = await this.papersRepository.find(paperId);
    if (!paper) throw new NotFoundException('No paper found with this id');

    const result = await this.papersRepository.searchInPaper(paperId, q);

    return {
      query: q,
      ...result,
    };
  }

  async getCategories(
    dto: PaperCategoriesReqDto,
  ): Promise<HttpResponse<PaperCategoryResDto[]>> {
    const { limit, skip } = dto;
    const categories = await this.papersRepository.listCategories(limit, skip);
    const data = categories.map((category) =>
      PaperCategoryResDto.fromValue(category),
    );

    return {
      message: 'Paper categories retrieved successfully',
      data,
      size: data.length,
    };
  }

  // ============ Helpers ============ //

  private async searchExternal(q: string, limit: number): Promise<string[]> {
    const response = await firstValueFrom(
      this.httpService.post<{ response: string[] }, SearchReqBody>(
        `${this.configService.get('EXTERNAL_API_BASE_URL')}/search/papers`,
        { question: q, limit },
      ),
    );

    return response.data.response;
  }
}
