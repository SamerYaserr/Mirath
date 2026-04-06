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
import { GetUserSavedListsResDto } from './dtos/responses/get-saved-lists.res.dto';

@Injectable()
export class ReadingListsService {
  constructor(
    private readonly readingListsRepository: ReadingListsRepository,
  ) {}

  async create(
    userId: string,
    data: CreateReadingListReqDto,
  ): Promise<HttpResponse<CreatedListResDto>> {
    const list = await this.readingListsRepository.create({
      title: data.title,
      description: data.description ?? null,
      isPublic: data.isPublic ?? true,
      ownerId: userId,
    });

    return {
      message: 'The reading list has been successfully created.',
      data: CreatedListResDto.fromList(list),
    };
  }

  async findAll(
    userId: string,
    ownerId?: string,
    saved?: boolean,
  ): Promise<
    HttpResponse<GetUserReadingListsResDto[] | GetUserSavedListsResDto[]>
  > {
    if (saved && ownerId)
      throw new BadRequestException(
        'You can only find saved reading lists or by ownerId',
      );

    if (saved) {
      const lists = await this.readingListsRepository.findAllSaved(userId);

      const data = lists.map(GetUserSavedListsResDto.fromList);

      return {
        message: 'Saved reading lists fetched successfully',
        data,
        size: data.length,
      };
    }

    const lists = await this.readingListsRepository.findAllByUserId(
      userId,
      ownerId,
    );
    const data = lists.map(GetUserReadingListsResDto.fromList);

    return {
      message: 'Reading lists fetched successfully',
      data,
      size: data.length,
    };
  }

  async getAllLists(): Promise<HttpResponse<GetAllSystemReadingListsResDto[]>> {
    const lists = await this.readingListsRepository.findAll();
    const data = lists.map(GetAllSystemReadingListsResDto.fromList);
    return {
      message: 'All reading lists fetched successfully',
      data,
      size: data.length,
    };
  }

  async findOne(
    id: string,
    userId?: string,
  ): Promise<HttpResponse<FindOneReadingListResDto>> {
    const [list, savedRecord] = await Promise.all([
      this.readingListsRepository.findById(id),
      userId
        ? this.readingListsRepository.findSavedById(id, userId)
        : Promise.resolve(null),
    ]);

    if (!list) {
      throw new NotFoundException('Reading list not found');
    }

    if (!list.isPublic && list.ownerId !== userId) {
      throw new ForbiddenException(
        'You do not have access to this private list',
      );
    }

    const isSaved = !!savedRecord;

    return {
      message: 'Reading list fetched successfully',
      data: FindOneReadingListResDto.fromList({ ...list, isSaved }),
    };
  }

  async addPaper(
    id: string,
    paperId: string,
    userId: string,
  ): Promise<HttpResponse<AddedPaperResDto>> {
    try {
      const record = await this.readingListsRepository.findOwner(id);
      if (!record) {
        throw new NotFoundException('Reading list not found');
      }

      if (record.ownerId !== userId) {
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
    const record = await this.readingListsRepository.findOwner(id);
    if (!record) {
      throw new NotFoundException('Reading list not found');
    }

    if (record.ownerId !== userId) {
      throw new ForbiddenException(
        'You can only modify your own reading lists',
      );
    }

    try {
      await this.readingListsRepository.removePaper(id, paperId);
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
}
