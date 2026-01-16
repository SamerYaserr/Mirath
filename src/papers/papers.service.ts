import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaperRepository } from './repositories/paper.repository';
import { HttpResponse } from 'src/common/types/api.types';

@Injectable()
export class PapersService {
  constructor(private paperRepository: PaperRepository) {}

  async savePaper(paperId: string, userId: string): Promise<HttpResponse> {
    const paper = await this.paperRepository.find(paperId);
    if (!paper) throw new NotFoundException('No paper found with this id');

    const isSaved = await this.paperRepository.findSaved(paperId, userId);
    if (isSaved) throw new ConflictException('This paper is already saved');

    const savedPaper = await this.paperRepository.create(paperId, userId);
    return {
      message: 'Paper saved successfully',
      data: savedPaper,
    };
  }

  async deleteSavedPaper(
    paperId: string,
    userId: string,
  ): Promise<HttpResponse> {
    const paper = await this.paperRepository.find(paperId);
    if (!paper) throw new NotFoundException('No paper found with this id');

    const isSaved = await this.paperRepository.findSaved(paperId, userId);
    if (!isSaved) throw new BadRequestException('This paper is not saved');

    await this.paperRepository.deleteSaved(paperId, userId);
    return { message: 'Paper deleted successfully' };
  }
}
