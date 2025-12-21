import { Injectable } from '@nestjs/common';

import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class HealthService {
  constructor(private readonly prisma: PrismaService) {}
  getLiveness() {
    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    };
  }

  async getReadiness() {
    const start = Date.now();

    const dbCheck = await this.checkDatabase();
    const durationMs = Date.now() - start;

    if (!dbCheck.ok) {
      return {
        status: 'unavailable',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        details: {
          db: {
            status: 'error',
            message: dbCheck.error ?? 'unknown',
          },
          latencyMs: durationMs,
        },
      };
    }

    return {
      status: 'ok',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      details: {
        db: {
          status: 'ok',
        },
        latencyMs: durationMs,
      },
    };
  }

  private async checkDatabase(): Promise<
    { ok: true } | { ok: false; error: string }
  > {
    try {
      await this.prisma.$queryRaw`SELECT 1`;

      return { ok: true };
    } catch (err: any) {
      const message = err?.message ?? String(err);
      return { ok: false, error: message };
    }
  }
}
