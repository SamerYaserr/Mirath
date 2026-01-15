import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaperRepository } from './repositories/paper.repository';

@Injectable()
export class PapersService {
  constructor(private paperRepository: PaperRepository) {}

  async savePaper(paperId: string, userId: string) {
    const paper = await this.paperRepository.find(paperId);
    if (!paper) throw new NotFoundException('No paper found with this id');

    const isSaved = await this.paperRepository.findSaved(paperId, userId);
    if (isSaved) throw new ConflictException('This paper is already saved');

    return await this.paperRepository.create(paperId, userId);
  }

  deleteSavedPaper(id: string, userId: string) {}
}
