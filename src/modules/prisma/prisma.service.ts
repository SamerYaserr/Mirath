import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient, type Prisma } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

import { configuration } from '../../config/configuration';
import { winstonLogger } from '../../config/logger.config';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor() {
    const config = configuration();

    const pool = new Pool({ 
        connectionString: config.DATABASE_URL 
    });

    const adapter = new PrismaPg(pool);

    super({
      adapter,
      log: [
        {
          emit: 'event',
          level: 'query',
        },
        {
          emit: 'event',
          level: 'info',
        },
        {
          emit: 'event',
          level: 'warn',
        },
        {
          emit: 'event',
          level: 'error',
        },
      ],
    });

    this.$on('query' as never, (e: Prisma.QueryEvent) => {
      const params = e.params !== '[]' ? e.params : '';
      winstonLogger.info('Prisma Query', {
        query: e.query,
        params,
        duration: `${e.duration}ms`,
        timestamp: e.timestamp,
      });
    });

    this.$on('info' as never, (e: Prisma.LogEvent) => {
      winstonLogger.info('Prisma Info', {
        message: e.message,
        target: e.target,
      });
    });

    this.$on('warn' as never, (e: Prisma.LogEvent) => {
      winstonLogger.warn('Prisma Warning', {
        message: e.message,
        target: e.target,
      });
    });

    this.$on('error' as never, (e: Prisma.LogEvent) => {
      winstonLogger.error('Prisma Error', {
        message: e.message,
        target: e.target,
      });
    });

    this.$on('query' as never, (e: Prisma.QueryEvent) => {
      const duration = e.duration;
      const params = e.params !== '[]' ? e.params : '';

      const logData = {
        query: e.query,
        params,
        duration: `${duration}ms`,
      };

      if (duration > 200) {
        // Log slow queries taking more than 200ms
        winstonLogger.warn('SLOW QUERY DETECTED', {
          ...logData,
          threshold: '200ms',
        });
      } else {
        winstonLogger.info('Prisma Query', logData);
      }
    });
  }

  async onModuleInit() {
    await this.$connect();
    winstonLogger.info('Prisma connected to database');
  }

  async onModuleDestroy() {
    await this.$disconnect();
    winstonLogger.info('Prisma disconnected from database');
  }
}
