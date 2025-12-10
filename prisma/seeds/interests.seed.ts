import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';
import { configuration } from '../../src/config/configuration';
import { winstonLogger as logger } from '../../src/config/logger.config';

const config = configuration();

const pool = new Pool({
  connectionString: config.DATABASE_URL,
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter,
});

const researchInterests = [
  // Natural Sciences
  'Physics',
  'Chemistry',
  'Biology',
  'Astronomy',
  'Geology',
  'Oceanography',
  'Meteorology',
  'Environmental Science',
  'Ecology',
  'Zoology',
  'Botany',
  'Microbiology',
  'Genetics',
  'Biochemistry',
  'Molecular Biology',
  'Neuroscience',

  // Medicine & Health
  'Medicine',
  'Public Health',
  'Epidemiology',
  'Immunology',
  'Pharmacology',
  'Cardiology',
  'Oncology',
  'Psychiatry',
  'Nutrition',
  'Clinical Psychology',
  'Physical Therapy',
  'Nursing',
  'Pediatrics',
  'Geriatrics',

  // Engineering & Technology
  'Computer Science',
  'Artificial Intelligence',
  'Machine Learning',
  'Data Science',
  'Software Engineering',
  'Cybersecurity',
  'Robotics',
  'Electrical Engineering',
  'Mechanical Engineering',
  'Civil Engineering',
  'Chemical Engineering',
  'Aerospace Engineering',
  'Biomedical Engineering',
  'Materials Science',
  'Nanotechnology',
  'Quantum Computing',

  // Mathematics & Statistics
  'Mathematics',
  'Statistics',
  'Applied Mathematics',
  'Computational Mathematics',
  'Cryptography',

  // Social Sciences
  'Psychology',
  'Sociology',
  'Anthropology',
  'Economics',
  'Political Science',
  'International Relations',
  'Geography',
  'Demography',
  'Social Work',
  'Criminology',
  'Education',
  'Linguistics',
  'Communication Studies',

  // Humanities
  'History',
  'Philosophy',
  'Literature',
  'Art History',
  'Religious Studies',
  'Cultural Studies',
  'Ethics',
  'Archaeology',
  'Classics',

  // Business & Management
  'Business Administration',
  'Marketing',
  'Finance',
  'Accounting',
  'Management',
  'Entrepreneurship',
  'Human Resources',
  'Operations Research',
  'Supply Chain Management',
  'Organizational Behavior',

  // Interdisciplinary & Applied
  'Urban Planning',
  'Agricultural Science',
  'Food Science',
  'Sustainability Studies',
  'Climate Change',
  'Renewable Energy',
  'Biotechnology',
  'Cognitive Science',
  'Game Theory',
  'Information Systems',
  'Library Science',
  'Sports Science',
  'Gender Studies',
  'Media Studies',
  'Digital Humanities',

  // Law & Policy
  'Law',
  'Public Policy',
  'Constitutional Law',
  'Environmental Law',
  'Health Policy',

  // Arts & Design
  'Architecture',
  'Graphic Design',
  'Music Theory',
  'Film Studies',
  'Performing Arts',
  'Industrial Design',
];

async function seedInterests() {
  logger.info('Starting interests seeding...');

  try {
    const result = await prisma.interest.createMany({
      data: researchInterests.map((name) => ({ name })),
      skipDuplicates: true,
    });

    logger.info(`Successfully seeded ${result.count} interests`);
  } catch (error) {
    console.error('Error seeding interests:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

seedInterests();
