import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';

import { PaperAnnotationsController } from './paper-annotations.controller';
import { PaperAnnotationsService } from './paper-annotations.service';
import { HighlightsRepository } from './repositories/highlights.repository';
import { PapersModule } from '../papers/papers.module';
import { AiServicesProxy } from './proxies/ai-services.proxy';

@Module({
  imports: [PapersModule, HttpModule],
  controllers: [PaperAnnotationsController],
  providers: [PaperAnnotationsService, HighlightsRepository, AiServicesProxy],
  exports: [HighlightsRepository],
})
export class PaperAnnotationsModule {}
