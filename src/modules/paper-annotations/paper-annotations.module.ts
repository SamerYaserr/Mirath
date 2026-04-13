import { Module } from '@nestjs/common';

import { PapersModule } from '../papers/papers.module';
import { PaperAnnotationsService } from './paper-annotations.service';
import { PaperAnnotationsController } from './paper-annotations.controller';
import { HighlightsRepository } from './repositories/highlights.repository';

@Module({
  imports: [PapersModule],
  controllers: [PaperAnnotationsController],
  providers: [PaperAnnotationsService, HighlightsRepository],
})
export class PaperAnnotationsModule {}
