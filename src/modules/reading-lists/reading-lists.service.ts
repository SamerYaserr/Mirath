import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ReadingListsRepository } from './repositories/reading-lists.repository';
import { CreateReadingListDto } from './dtos/create-reading-list.dto';

@Injectable()
export class ReadingListsService {
  constructor(private readonly readingListsRepository: ReadingListsRepository) {}

  async create(userId: string, data: CreateReadingListDto) {
    return this.readingListsRepository.create(userId, data);
  }

  async findAll(userId: string) {
    return this.readingListsRepository.findAllByUserId(userId);
  }

  async findOne(id: string, userId?: string) {
    const list = await this.readingListsRepository.findById(id);
    if (!list) {
      throw new NotFoundException('Reading list not found');
    }

    if (!list.isPublic && list.ownerId !== userId) {
      throw new ForbiddenException('You do not have access to this private list');
    }

    return list;
  }

  async addPaper(id: string, paperId: string, userId: string) {
    const list = await this.readingListsRepository.findById(id);
    if (!list) {
      throw new NotFoundException('Reading list not found');
    }

    const isOwner = await this.readingListsRepository.isOwner(id, userId);
    if (!isOwner) {
      throw new ForbiddenException('You can only modify your own reading lists');
    }
    return this.readingListsRepository.addPaper(id, paperId);
  }

  async removePaper(id: string, paperId: string, userId: string) {
    const list = await this.readingListsRepository.findById(id);
    if (!list) {
      throw new NotFoundException('Reading list not found');
    }
    const isOwner = await this.readingListsRepository.isOwner(id, userId);
    if (!isOwner) {
      throw new ForbiddenException('You can only modify your own reading lists');
    }

    return this.readingListsRepository.removePaper(id, paperId);
  }
}
