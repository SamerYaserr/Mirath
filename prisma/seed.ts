import 'dotenv/config';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

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
  logger.info('🚀 Starting database seeding...');

  const { interests } = await import('./seeds/interests.seed.ts');
  await prisma.interest.createMany({
    data: interests.map((interest) => ({ name: interest.name })),
    skipDuplicates: true,
  });

  logger.info('🌱 Seeding completed successfully!');
}

runSeeders()
  .catch((err) => {
    console.error('❌ Seed failed:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
