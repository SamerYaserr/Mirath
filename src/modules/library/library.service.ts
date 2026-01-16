import { Injectable } from '@nestjs/common';

import { SortOrder } from './dtos/get-saved-papers.dto';
import { HttpResponse } from 'src/common/types/api.types';
import { LibraryRepository } from './repositories/library.repository';

@Injectable()
export class LibraryService {
  constructor(private libraryRepository: LibraryRepository) {}

  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 10,
    sort: SortOrder = SortOrder.DESC,
  ): Promise<HttpResponse> {
    const skip = (page - 1) * limit;
    const papers = await this.libraryRepository.findAll(
      userId,
      skip,
      limit,
      sort,
    );

    return { size: papers.length, data: papers };
  }
}
