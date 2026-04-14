import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { HttpResponse } from 'src/common/types/api.types';
import { HighlightsRepository } from './repositories/highlights.repository';
import { HighlightResDto } from './dto/responses/Highlight.res.dto';

@Injectable()
export class PaperAnnotationsService {
  constructor(private highlightsRepository: HighlightsRepository) {}

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
}
