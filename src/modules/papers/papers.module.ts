import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { PapersService } from './papers.service';
import { PapersController } from './papers.controller';
import { PapersRepository } from './repositories/papers.repository';

@Module({
  imports: [HttpModule],
  controllers: [PapersController],
  providers: [PapersService, PapersRepository],
  exports: [PapersRepository],
})
export class PapersModule {}
