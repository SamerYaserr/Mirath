import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
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
import { GetReadingListsQueryReqDto } from './dtos/requests/get-reading-lists-query.req.dto';
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
    const list = await this.readingListsRepository.create({
      title: data.title,
      description: data.description ?? null,
      isPublic: data.isPublic ?? false,
      ownerId: userId,
    });

    return {
      message: 'The reading list has been successfully created.',
      data: CreatedListResDto.fromList(list),
    };
  }

  async findAll(
    userId: string,
    { ownerId, skip, limit }: GetReadingListsQueryReqDto,
  ): Promise<HttpResponse<GetUserReadingListsResDto[]>> {
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
      data: FindOneReadingListResDto.fromList(list),
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
