import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

import { seedPapers } from './seeds/papers.seed';
import { seedInterests } from './seeds/interests.seed';
import { configuration } from '../src/config/configuration';
import { winstonLogger as logger } from '../src/config/logger.config';

const config = configuration();

const pool = new Pool({
  connectionString: config.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

async function runSeeders() {
  logger.info('Starting database seeding...');

  await seedPapers(prisma);
  await seedInterests(prisma);

  logger.info('Seeding completed successfully!');
}

runSeeders()
  .catch((err) => {
    logger.error('Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
