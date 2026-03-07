import { Injectable } from '@nestjs/common';

import { SortOrder } from './dto/requests/get-saved-papers.req.dto';
import { HttpResponse } from 'src/common/types/api.types';
import { SavedPapersRepository } from '../papers/repositories/saved-papers.repository';
import { SavedPapersResDto } from './dto/responses/saved-paper-summary.res.dto';

@Injectable()
export class LibraryService {
  constructor(private savedPapersRepository: SavedPapersRepository) {}

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
}
