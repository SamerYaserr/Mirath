import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';

import { HttpResponse } from 'src/common/types/api.types';
import { ReadingListsRepository } from './repositories/reading-lists.repository';
import { CreateReadingListReqDto } from './dtos/requests/create-reading-list.req.dto';
import { CreatedListResDto } from './dtos/responses/create-reading-list.res.dto';
import {
  GetAllSystemReadingListsResDto,
  GetUserReadingListsResDto,
} from './dtos/responses/get-all-lists.res.dto';
import { FindOneReadingListResDto } from './dtos/responses/find-one-reading-list.res.dto';
import { AddedPaperResDto } from './dtos/responses/add-paper.res.dto';
import { UpdateReadingListServiceParams } from './reading-list.types';
import { PrismaService } from '../prisma/prisma.service';
import { PaginationDto } from 'src/common/dto/pagination.dto';

@Injectable()
export class ReadingListsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly readingListsRepository: ReadingListsRepository,
  ) {}

  async create(
    userId: string,
    data: CreateReadingListReqDto,
  ): Promise<HttpResponse<CreatedListResDto>> {
    if (data.isPublic === undefined) {
      const userSettings = await this.prisma.userSettings.findUnique({
        where: { userId },
      });
      data.isPublic = userSettings?.defaultReadingListVisibility ?? false;
    }

    const list = await this.readingListsRepository.create({
      title: data.title,
      description: data.description ?? null,
      isPublic: data.isPublic,
      ownerId: userId,
    });

    return {
      message: 'The reading list has been successfully created.',
      data: CreatedListResDto.fromList(list),
    };
  }

  async findAll(
    userId: string,
    skip: number,
    limit: number,
    ownerId?: string,
    saved?: boolean,
  ): Promise<HttpResponse<GetUserReadingListsResDto[]>> {
    if (saved && ownerId)
      throw new BadRequestException(
        'You can only find saved reading lists or by ownerId',
      );

    if (saved) {
      const lists = await this.readingListsRepository.findAllSaved(userId);

      const data = lists.map((list) =>
        GetUserReadingListsResDto.fromList(list.readingList),
      );

      return {
        message: 'Saved reading lists fetched successfully',
        data,
        size: data.length,
      };
    }

    const [lists, totalCount] = await Promise.all([
      this.readingListsRepository.findAllByUserId(userId, ownerId, {
        skip,
        take: limit,
      }),
      this.readingListsRepository.countByUserId(userId, ownerId),
    ]);

    const data = lists.map(GetUserReadingListsResDto.fromList);
    return {
      message: 'Reading lists fetched successfully',
      data,
      size: totalCount,
    };
  }

  async getAllLists({
    skip,
    limit,
  }: PaginationDto): Promise<HttpResponse<GetAllSystemReadingListsResDto[]>> {
    const [lists, listsCount] = await Promise.all([
      this.readingListsRepository.findAll({
        skip,
        take: limit,
      }),
      this.readingListsRepository.count(),
    ]);

    const data = lists.map(GetAllSystemReadingListsResDto.fromList);
    return {
      message: 'All reading lists fetched successfully',
      data,
      size: listsCount,
    };
  }

  async findOne(
    id: string,
    userId?: string,
  ): Promise<HttpResponse<FindOneReadingListResDto>> {
    const [list, savedRecord] = await Promise.all([
      this.readingListsRepository.findById(id, userId),
      userId
        ? this.readingListsRepository.findSavedById(id, userId)
        : Promise.resolve(null),
    ]);

    if (!list) throw new NotFoundException('Reading list not found');
    if (!list.isPublic && list.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this private list',
      );
    }

    const isSaved = !!savedRecord;

    const normalisedPapers = list.papers.map((entry) => ({
      readingListId: entry.readingListId,
      paperId: entry.paperId,
      paper: {
        id: entry.paper.id,
        title: entry.paper.title,
        authors: entry.paper.authors,
        abstract: entry.paper.abstract,
        categories: entry.paper.categories,
        publishedAt: entry.paper.publishedAt,
        citation: entry.paper.citation,
        isSaved: userId ? (entry.paper.savedPapers ?? []).length > 0 : false,
      },
    }));

    return {
      message: 'Reading list fetched successfully',
      data: FindOneReadingListResDto.fromList({
        ...list,
        papers: normalisedPapers,
        isSaved,
      }),
    };
  }

  async addPaper(
    id: string,
    paperId: string,
    userId: string,
  ): Promise<HttpResponse<AddedPaperResDto>> {
    try {
      const addedPaper = await this.prisma.$transaction(async (tx) => {
        await this.verifyOwnership(id, userId, tx);
        return this.readingListsRepository.addPaper(id, paperId, tx);
      });
      return {
        message: 'Paper saved successfully',
        data: AddedPaperResDto.fromRecord(addedPaper),
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

  async removePaper(
    id: string,
    paperId: string,
    userId: string,
  ): Promise<HttpResponse> {
    try {
      await this.prisma.$transaction(async (tx) => {
        await this.verifyOwnership(id, userId, tx);
        await this.readingListsRepository.removePaper(id, paperId, tx);
      });
      return {
        message: 'Paper removed from the reading list successfully',
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new NotFoundException('Paper not found in this reading list');
      }
      throw error;
    }
  }

  async save(id: string, userId: string): Promise<HttpResponse> {
    const list = await this.readingListsRepository.findById(id);
    if (!list) throw new NotFoundException('Reading list not found.');

    if (list.ownerId === userId)
      throw new BadRequestException('You cannot save your own list.');

    if (!list.isPublic)
      throw new ForbiddenException('You cannot save a private list.');

    await this.readingListsRepository.save(id, userId);

    return { message: 'List saved successfully.' };
  }

  async unsave(id: string, userId: string): Promise<HttpResponse> {
    const count = await this.readingListsRepository.unsave(id, userId);
    if (!count) throw new NotFoundException('You have not saved this list.');

    return { message: 'List unsaved successfully.' };
  }
  async update({
    id,
    userId,
    data,
  }: UpdateReadingListServiceParams): Promise<HttpResponse<CreatedListResDto>> {
    const updatedRecord = await this.prisma.$transaction(async (tx) => {
      await this.verifyOwnership(id, userId, tx);
      return this.readingListsRepository.update(id, data, tx);
    });
    return {
      message: 'Reading list updated successfully',
      data: CreatedListResDto.fromList(updatedRecord),
    };
  }

  async delete(id: string, userId: string): Promise<HttpResponse> {
    await this.prisma.$transaction(async (tx) => {
      await this.verifyOwnership(id, userId, tx);
      await this.readingListsRepository.delete(id, tx);
    });
    return {
      message: 'Reading list deleted successfully',
    };
  }

  // -- Helpers --
  async verifyOwnership(
    id: string,
    userId: string,
    tx?: Prisma.TransactionClient,
  ) {
    const record = await this.readingListsRepository.findOwner(id, tx);
    if (!record) {
      throw new NotFoundException('Reading list not found');
    }

    if (record.ownerId !== userId) {
      throw new ForbiddenException(
        'You can only modify your own reading lists',
      );
    }
  }
}
