import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PapersRepository } from './repositories/papers.repository';
import { SearchPaperDto } from './dto/search-paper.dto';
import { HttpResponse } from 'src/common/types/api.types';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { AppConfig } from 'src/config/configuration';
import { firstValueFrom } from 'rxjs';
import { winstonLogger as logger } from 'src/config/logger.config';

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
  ) {}

  async savePaper(paperId: string, userId: string): Promise<HttpResponse> {
    const paper = await this.papersRepository.find(paperId);
    if (!paper) throw new NotFoundException('No paper found with this id');

    try {
      const savedPaper = await this.papersRepository.create(paperId, userId);
      return {
        message: 'Paper saved successfully',
        data: savedPaper,
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
  ): Promise<HttpResponse> {
    const paper = await this.papersRepository.find(paperId);
    if (!paper) throw new NotFoundException('No paper found with this id');

    try {
      await this.papersRepository.deleteSaved(paperId, userId);
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
    searchDto: SearchPaperDto,
  ): Promise<HttpResponse> {
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

    if (papers.length > 0)
      void this.papersRepository.createSearchHistory(userId, q);

    return {
      message:
        papers.length > 0
          ? 'Search results retrieved successfully'
          : 'No results found',
      data: papers,
      size: papers.length,
    };
  }

  async find(paperId: string): Promise<HttpResponse> {
    const paper = await this.papersRepository.find(paperId);
    if (!paper) throw new NotFoundException('No paper found with this id');

    return {
      data: paper,
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
