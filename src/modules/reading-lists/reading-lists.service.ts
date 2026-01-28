import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
} from '@nestjs/common';
import { ReadingListsRepository } from './repositories/reading-lists.repository';
import { CreateReadingListDto } from './dtos/create-reading-list.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class ReadingListsService {
  constructor(
    private readonly readingListsRepository: ReadingListsRepository,
  ) {}

  async create(userId: string, data: CreateReadingListDto) {
    const list = await this.readingListsRepository.create(userId, data);
    return {
      message: 'The reading list has been successfully created.',
      data: list,
    };
  }

  async findAll(userId: string, ownerId?: string) {
    const lists = await this.readingListsRepository.findAllByUserId(
      userId,
      ownerId,
    );

    const data = lists.map((list) => {
      const categories = list.papers.flatMap((p) => p.paper.categories || []);

      const uniqueCategories = [...new Set(categories)];
      const previewTags = uniqueCategories.slice(0, 3);

      const { papers, ...listWithoutPapers } = list;

      return {
        ...listWithoutPapers,
        previewTags,
      };
    });

    return {
      message: 'Reading lists fetched successfully',
      data,
      size: data.length,
    };
  }

  async findOne(id: string, userId?: string) {
    const list = await this.readingListsRepository.findById(id);
    if (!list) {
      throw new NotFoundException('Reading list not found');
    }

    if (!list.isPublic && list.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this private list',
      );
    }

    return {
      message: 'Reading list fetched successfully',
      data: list,
    };
  }

  async addPaper(id: string, paperId: string, userId: string) {
    try {
      const list = await this.readingListsRepository.findById(id);
      if (!list) {
        throw new NotFoundException('Reading list not found');
      }

      const isOwner = await this.readingListsRepository.isOwner(id, userId);
      if (!isOwner) {
        throw new ForbiddenException(
          'You can only modify your own reading lists',
        );
      }

      const addedPaper = await this.readingListsRepository.addPaper(
        id,
        paperId,
      );
      return {
        message: 'Paper saved successfully',
        data: addedPaper,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(
          'This paper is already in the reading list',
        );
      }
      throw error;
    }
  }

  async removePaper(id: string, paperId: string, userId: string) {
    const list = await this.readingListsRepository.findById(id);
    if (!list) {
      throw new NotFoundException('Reading list not found');
    }
    const isOwner = await this.readingListsRepository.isOwner(id, userId);
    if (!isOwner) {
      throw new ForbiddenException(
        'You can only modify your own reading lists',
      );
    }

    try {
      await this.readingListsRepository.removePaper(id, paperId);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Paper not found in this reading list');
      }
      throw error;
    }
    return {
      message: 'Paper removed from the reading list successfully',
    };
  }
}
