import { Prisma, PrismaClient } from '@prisma/client';

import { winstonLogger as logger } from '../../src/config/logger.config';

export const interests: Prisma.InterestCreateInput[] = [
  // Natural Sciences
  { name: 'Physics' },
  { name: 'Chemistry' },
  { name: 'Biology' },
  { name: 'Astronomy' },
  { name: 'Geology' },
  { name: 'Oceanography' },
  { name: 'Meteorology' },
  { name: 'Environmental Science' },
  { name: 'Ecology' },
  { name: 'Zoology' },
  { name: 'Botany' },
  { name: 'Microbiology' },
  { name: 'Genetics' },
  { name: 'Biochemistry' },
  { name: 'Molecular Biology' },
  { name: 'Neuroscience' },

  // Medicine & Health
  { name: 'Medicine' },
  { name: 'Public Health' },
  { name: 'Epidemiology' },
  { name: 'Immunology' },
  { name: 'Pharmacology' },
  { name: 'Cardiology' },
  { name: 'Oncology' },
  { name: 'Psychiatry' },
  { name: 'Nutrition' },
  { name: 'Clinical Psychology' },
  { name: 'Physical Therapy' },
  { name: 'Nursing' },
  { name: 'Pediatrics' },
  { name: 'Geriatrics' },

  // Engineering & Technology
  { name: 'Computer Science' },
  { name: 'Artificial Intelligence' },
  { name: 'Machine Learning' },
  { name: 'Data Science' },
  { name: 'Software Engineering' },
  { name: 'Cybersecurity' },
  { name: 'Robotics' },
  { name: 'Electrical Engineering' },
  { name: 'Mechanical Engineering' },
  { name: 'Civil Engineering' },
  { name: 'Chemical Engineering' },
  { name: 'Aerospace Engineering' },
  { name: 'Biomedical Engineering' },
  { name: 'Materials Science' },
  { name: 'Nanotechnology' },
  { name: 'Quantum Computing' },

  // Mathematics & Statistics
  { name: 'Mathematics' },
  { name: 'Statistics' },
  { name: 'Applied Mathematics' },
  { name: 'Computational Mathematics' },
  { name: 'Cryptography' },

  // Social Sciences
  { name: 'Psychology' },
  { name: 'Sociology' },
  { name: 'Anthropology' },
  { name: 'Economics' },
  { name: 'Political Science' },
  { name: 'International Relations' },
  { name: 'Geography' },
  { name: 'Demography' },
  { name: 'Social Work' },
  { name: 'Criminology' },
  { name: 'Education' },
  { name: 'Linguistics' },
  { name: 'Communication Studies' },

  // Humanities
  { name: 'History' },
  { name: 'Philosophy' },
  { name: 'Literature' },
  { name: 'Art History' },
  { name: 'Religious Studies' },
  { name: 'Cultural Studies' },
  { name: 'Ethics' },
  { name: 'Archaeology' },
  { name: 'Classics' },

  // Business & Management
  { name: 'Business Administration' },
  { name: 'Marketing' },
  { name: 'Finance' },
  { name: 'Accounting' },
  { name: 'Management' },
  { name: 'Entrepreneurship' },
  { name: 'Human Resources' },
  { name: 'Operations Research' },
  { name: 'Supply Chain Management' },
  { name: 'Organizational Behavior' },

  // Interdisciplinary & Applied
  { name: 'Urban Planning' },
  { name: 'Agricultural Science' },
  { name: 'Food Science' },
  { name: 'Sustainability Studies' },
  { name: 'Climate Change' },
  { name: 'Renewable Energy' },
  { name: 'Biotechnology' },
  { name: 'Cognitive Science' },
  { name: 'Game Theory' },
  { name: 'Information Systems' },
  { name: 'Library Science' },
  { name: 'Sports Science' },
  { name: 'Gender Studies' },
  { name: 'Media Studies' },
  { name: 'Digital Humanities' },

  // Law & Policy
  { name: 'Law' },
  { name: 'Public Policy' },
  { name: 'Constitutional Law' },
  { name: 'Environmental Law' },
  { name: 'Health Policy' },

  // Arts & Design
  { name: 'Architecture' },
  { name: 'Graphic Design' },
  { name: 'Music Theory' },
  { name: 'Film Studies' },
  { name: 'Performing Arts' },
  { name: 'Industrial Design' },
];

export async function seedInterests(prisma: PrismaClient) {
  await prisma.interest.createMany({
    data: interests,
    skipDuplicates: true,
  });

  logger.info('Interests seeding completed successfully');
}
