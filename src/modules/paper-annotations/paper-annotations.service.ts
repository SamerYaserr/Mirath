import {
  BadRequestException,
  ConflictException,
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
import { ExplainReqDto } from './dto/requests/explain.req.dto';
import { AiServicesProxy } from './proxies/ai-services.proxy';
import { IdDto } from 'src/common/dto/id.dto';
import { SummarizeDto } from './dto/requests/summarize.req.dto';
import { AiServiceResDto } from './dto/responses/ai-service.res.dto';

@Injectable()
export class PaperAnnotationsService {
  constructor(
    private readonly highlightsRepository: HighlightsRepository,
    private readonly papersRepository: PapersRepository,
    private readonly aiServicesProxy: AiServicesProxy,
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
    const { data, count } =
      await this.highlightsRepository.findAllByUserAndPaper(
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

  async remove(userId: string, highlightId: string): Promise<HttpResponse> {
    const highlight = await this.highlightsRepository.findById(highlightId);
    if (!highlight) throw new NotFoundException('Highlight not found');
    if (highlight.userId !== userId)
      throw new ForbiddenException('You can only delete your own highlights');

    await this.highlightsRepository.delete(highlightId);

    return { message: 'Highlight deleted successfully' };
  }

  async takeNote(
    userId: string,
    highlightId: string,
    paperId: string,
    note: string,
  ): Promise<HttpResponse> {
    const highlight = await this.highlightsRepository.find(highlightId);
    if (!highlight)
      throw new NotFoundException('No highlight found with this id.');

    if (highlight.paperId !== paperId)
      throw new BadRequestException(
        'This highlight does not belong to the given paper.',
      );

    if (highlight.userId !== userId)
      throw new ForbiddenException(
        'You do not have permission to perform this action.',
      );
    if (highlight.note)
      return new ConflictException(
        'This highlight already has a note. Use PATCH to update it.',
      );

    const updatedHighlight = await this.highlightsRepository.setNote(
      highlightId,
      note,
    );

    return {
      data: HighlightResDto.fromEntity(updatedHighlight),
    };
  }

  async editNote(
    userId: string,
    highlightId: string,
    paperId: string,
    note: string,
  ): Promise<HttpResponse> {
    const highlight = await this.highlightsRepository.find(highlightId);
    if (!highlight)
      throw new NotFoundException('No highlight found with this id.');

    if (highlight.paperId !== paperId)
      throw new BadRequestException(
        'This highlight does not belong to the given paper.',
      );

    if (highlight.userId !== userId)
      throw new ForbiddenException(
        'You do not have permission to perform this action.',
      );

    if (!highlight.note)
      return new NotFoundException(
        'No note found on this highlight. Use POST to create one.',
      );

    const updatedHighlight = await this.highlightsRepository.setNote(
      highlightId,
      note,
    );

    return {
      data: HighlightResDto.fromEntity(updatedHighlight),
    };
  }

  async deleteNote(
    userId: string,
    highlightId: string,
    paperId: string,
  ): Promise<HttpResponse> {
    const highlight = await this.highlightsRepository.find(highlightId);
    if (!highlight)
      throw new NotFoundException('No highlight found with this id.');

    if (highlight.paperId !== paperId)
      throw new BadRequestException(
        'This highlight does not belong to the given paper.',
      );

    if (highlight.userId !== userId)
      throw new ForbiddenException(
        'You do not have permission to perform this action.',
      );

    if (!highlight.note)
      return new NotFoundException('No note found on this highlight.');

    await this.highlightsRepository.deleteNote(highlightId);

    return {
      message: 'Note deleted successfully.',
    };
  }

  async getNotes(
    userId: string,
    paperId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<HttpResponse> {
    const skip = (page - 1) * limit;
    const [size, notes] = await Promise.all([
      this.highlightsRepository.countNotes(userId, paperId),
      this.highlightsRepository.getNotes(userId, paperId, skip, limit),
    ]);

    return {
      size,
      data: notes.map((note) => HighlightResDto.fromEntity(note)),
    };
  }

  async explainText({
    id: paperId,
    selectedText,
  }: IdDto & ExplainReqDto): Promise<HttpResponse<AiServiceResDto>> {
    const paper = await this.papersRepository.find(paperId);
    if (!paper) throw new NotFoundException('No paper fount with this id.');

    const explanation = await this.aiServicesProxy.call({
      service: 'explain',
      input_text: selectedText,
    });

    return { data: { answer: AiServiceResDto.fromAnswer(explanation).answer } };
  }
  async summarizeText({
    id: paperId,
    selectedText,
  }: IdDto & SummarizeDto): Promise<HttpResponse<AiServiceResDto>> {
    const paper = await this.papersRepository.find(paperId);
    if (!paper) throw new NotFoundException('Paper not found');

    const summary = await this.aiServicesProxy.call({
      service: 'summarize_snippet',
      input_text: selectedText,
    });

    return {
      data: {
        answer: AiServiceResDto.fromAnswer(summary).answer,
      },
    };
  }
}
