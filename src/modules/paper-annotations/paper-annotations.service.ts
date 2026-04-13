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
}
