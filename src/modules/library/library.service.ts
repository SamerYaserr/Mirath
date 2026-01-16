import { Injectable } from '@nestjs/common';
import { LibraryRepository } from './repositories/library.repository';
import { HttpResponse } from 'src/common/types/api.types';

@Injectable()
export class LibraryService {
  constructor(private libraryRepository: LibraryRepository) {}

  async findAll(
    userId: string,
    page: number = 1,
    limit: number = 10,
    sort: string = 'desc',
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
