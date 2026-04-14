import { Module } from '@nestjs/common';
import { PaperAnnotationsController } from './paper-annotations.controller';
import { PaperAnnotationsService } from './paper-annotations.service';
import { HighlightsRepository } from './repositories/highlights.repository';
import { PapersModule } from '../papers/papers.module';

@Module({
  imports: [PapersModule],
  controllers: [PaperAnnotationsController],
  providers: [PaperAnnotationsService, HighlightsRepository],
})
export class PaperAnnotationsModule {}
