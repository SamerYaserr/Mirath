import { prisma } from './prisma-client';
import { seedPapers } from './seeds/papers.seed';
import { seedInterests } from './seeds/interests.seed';
import { winstonLogger as logger } from '../src/config/logger.config';

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
