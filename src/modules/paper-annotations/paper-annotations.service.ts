import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';

import { HttpResponse } from 'src/common/types/api.types';
import { PapersRepository } from '../papers/repositories/papers.repository';
import { HighlightsRepository } from './repositories/highlights.repository';
import { CreateHighlightReqDto } from './dto/requests/create-highlight.req.dto';
import { UpdateHighlightReqDto } from './dto/requests/update-highlight.req.dto';
import { HighlightResDto } from './dto/responses/Highlight.res.dto';
import { HighlightColor } from '@prisma/client';

@Injectable()
export class PaperAnnotationsService {
  constructor(
    private readonly highlightsRepository: HighlightsRepository,
    private readonly papersRepository: PapersRepository,
  ) {}

  async create(
    userId: string,
    paperId: string,
    dto: CreateHighlightReqDto,
  ): Promise<HttpResponse<HighlightResDto>> {
    const paper = await this.papersRepository.find(paperId);
    if (!paper) throw new NotFoundException('Paper not found');

    const highlight = await this.highlightsRepository.create({
      userId,
      paperId,
      color: dto.color ?? HighlightColor.YELLOW,
      note: dto.note ?? null,
      xpathStart: dto.xpathStart,
      xpathEnd: dto.xpathEnd,
      startOffset: dto.startOffset,
      endOffset: dto.endOffset,
      selectedText: dto.selectedText,
      plainText: dto.plainText ?? null,
      htmlContent: dto.htmlContent ?? null,
      contextBefore: dto.contextBefore ?? null,
      contextAfter: dto.contextAfter ?? null,
      firstWord: dto.firstWord ?? null,
      lastWord: dto.lastWord ?? null,
      selectedWordCount: dto.selectedWordCount ?? null,
      selectedCharLength: dto.selectedCharLength ?? null,
    });

    return { data: HighlightResDto.fromEntity(highlight) };
  }

  async findAll(
    userId: string,
    paperId: string,
    page: number = 1,
    limit: number = 50,
  ): Promise<HttpResponse<HighlightResDto[]>> {
    const skip = (page - 1) * limit;
    const { data, count } = await this.highlightsRepository.findAllByUserAndPaper(
      userId,
      paperId,
      skip,
      limit,
    );

    return {
      size: count,
      data: data.map((h) => HighlightResDto.fromEntity(h)),
    };
  }

  async update(
    userId: string,
    highlightId: string,
    dto: UpdateHighlightReqDto,
  ): Promise<HttpResponse<HighlightResDto>> {
    const highlight = await this.highlightsRepository.findById(highlightId);
    if (!highlight) throw new NotFoundException('Highlight not found');
    if (highlight.userId !== userId)
      throw new ForbiddenException('You can only modify your own highlights');

    const updated = await this.highlightsRepository.updateColor(
      highlightId,
      dto.color!,
    );

    return { data: HighlightResDto.fromEntity(updated) };
  }

  async remove(
    userId: string,
    highlightId: string,
  ): Promise<HttpResponse> {
    const highlight = await this.highlightsRepository.findById(highlightId);
    if (!highlight) throw new NotFoundException('Highlight not found');
    if (highlight.userId !== userId)
      throw new ForbiddenException('You can only delete your own highlights');

    await this.highlightsRepository.delete(highlightId);

    return { message: 'Highlight deleted successfully' };
  }
}
