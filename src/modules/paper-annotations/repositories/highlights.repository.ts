import { Injectable } from '@nestjs/common';

import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class HighlightsRepository {
  constructor(private prisma: PrismaService) {}

  async find(id: string) {
    return await this.prisma.highlight.findFirst({ where: { id } });
  }

  async setNote(id: string, note: string) {
    return await this.prisma.highlight.update({
      where: { id },
      data: { note },
    });
  }
}
