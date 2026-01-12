import { Module } from '@nestjs/common';
import { PapersService } from './papers.service';
import { PapersController } from './papers.controller';
import { PapersRepository } from './repositories/papers.repository';
import { PrismaService } from '../prisma/prisma.service';

@Module({
  controllers: [PapersController],
  providers: [PapersService, PapersRepository, PrismaService],
})
export class PapersModule {}
