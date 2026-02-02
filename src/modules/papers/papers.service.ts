import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { PapersRepository } from './repositories/papers.repository';
import { SearchPaperDto } from './dto/search-paper.dto';
import { HttpResponse } from 'src/common/types/api.types';

@Injectable()
export class PapersService {
  constructor(private papersRepository: PapersRepository) {}

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

  async find(paperId: string): Promise<HttpResponse> {
    const paper = await this.papersRepository.find(paperId);
    if (!paper) throw new NotFoundException('No paper found with this id');

    return {
      data: paper,
    };
  }
}
