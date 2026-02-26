import { Module } from '@nestjs/common';
import { PapersService } from './papers.service';
import { PapersController } from './papers.controller';
import { PapersRepository } from './repositories/papers.repository';

@Module({
  controllers: [PapersController],
  providers: [PapersService, PapersRepository],
  exports: [PapersRepository],
})
export class PapersModule {}
