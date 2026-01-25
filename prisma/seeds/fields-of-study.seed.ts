import { Prisma, PrismaClient } from '@prisma/client';
import { winstonLogger as logger } from '../../src/config/logger.config';

const fields: Prisma.FieldOfStudyCreateInput[] = [
  { name: 'Computer Science' },
  { name: 'Electrical Engineering' },
  { name: 'Mechanical Engineering' },
  { name: 'Civil Engineering' },
  { name: 'Chemical Engineering' },
  { name: 'Biomedical Engineering' },
  { name: 'Physics' },
  { name: 'Mathematics' },
  { name: 'Statistics' },
  { name: 'Economics' },
  { name: 'Psychology' },
  { name: 'Sociology' },
  { name: 'Political Science' },
  { name: 'Philosophy' },
  { name: 'History' },
  { name: 'English Literature' },
  { name: 'Business Administration' },
  { name: 'Medicine' },
  { name: 'Law' },
  { name: 'Education' },
];

export async function seedFieldsOfStudy(prisma: PrismaClient) {
  logger.info('Seeding Fields of Study...');

  await prisma.fieldOfStudy.createMany({
    data: fields,
    skipDuplicates: true,
  });

  logger.info('Fields of Study seeding completed successfully');
}
