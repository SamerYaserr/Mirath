import { Module } from '@nestjs/common';
import { PaperAnnotationsController } from './paper-annotations.controller';
import { PapersModule } from '../papers/papers.module';

@Module({
  imports: [PapersModule],
  controllers: [PaperAnnotationsController],
  providers: [],
})
export class PaperAnnotationsModule {}
