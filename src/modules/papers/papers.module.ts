import { Module } from '@nestjs/common';
import { PapersService } from './papers.service';
import { PapersController } from './papers.controller';
import { PaperRepository } from './repositories/paper.repository';

@Module({
  controllers: [PapersController],
  providers: [PapersService, PaperRepository],
})
export class PapersModule {}
