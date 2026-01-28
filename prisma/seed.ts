import { prisma } from './prisma-client';
import { winstonLogger as logger } from '../src/config/logger.config';

// Independent Seeds
import { seedPapers } from './seeds/papers.seed';
import { seedInterests } from './seeds/interests.seed';
import { seedFieldsOfStudy } from './seeds/fields-of-study.seed';

// Base Entity Seeds
import { seedUsers } from './seeds/users.seed';

// Relation Seeds (Connects Users to Interests/Fields/Follows)
import { seedUserRelations } from './seeds/user-relations.seed';

// Content Seeds (Depends on Users & Papers)
import { seedReadingLists } from './seeds/reading-lists.seed';
import { seedDiscussions } from './seeds/discussions.seed';

// Dependent Content Seeds (Depends on Discussions)
import { seedComments } from './seeds/comments.seed';

async function runSeeders() {
  logger.info('Starting database seeding...');

  try {
    // --- Step 1: Seed Static/Independent Data ---
    // These tables don't rely on other tables (except Enums)
    await seedPapers(prisma);
    await seedInterests(prisma);
    await seedFieldsOfStudy(prisma);

    // --- Step 2: Seed Users ---
    // Creates the Admin and Random users
    await seedUsers(prisma);

    // --- Step 3: Seed User Relations ---
    // Links Users to Interests, Fields, and other Users (Follows)
    await seedUserRelations(prisma);

    // --- Step 4: Seed Primary Content ---
    // Reading Lists (User + Papers)
    await seedReadingLists(prisma);

    // Discussions (User + Papers + Interests)
    await seedDiscussions(prisma);

    // --- Step 5: Seed Nested Content ---
    // Comments (User + Discussions)
    await seedComments(prisma);

    logger.info('Seeding completed successfully!');
  } catch (error) {
    logger.error('Seed execution failed:', error);
    throw error;
  }
}

runSeeders()
  .catch((err) => {
    logger.error('Fatal seed error:', err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
