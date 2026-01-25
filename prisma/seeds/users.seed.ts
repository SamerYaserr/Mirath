import {
  PrismaClient,
  UserStatus,
  Role,
  LevelOfEducation,
} from '@prisma/client';
import { faker } from '@faker-js/faker';
import * as bcrypt from 'bcrypt'; // or import * as argon2 from 'argon2';
import { winstonLogger as logger } from '../../src/config/logger.config';

export async function seedUsers(prisma: PrismaClient) {
  logger.info('Seeding Users...');

  // Get Plain Password from Env
  const plainPassword = process.env.SEED_PASSWORD;

  if (!plainPassword) {
    throw new Error(
      'SEED_PASSWORD is not defined in .env. Please add the plaintext password to run seeds.',
    );
  }

  // Hash the password once (Salt rounds: 10)
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const users = [];

  // Admin User
  users.push({
    username: 'admin',
    email: 'admin@example.com',
    password: hashedPassword,
    fullName: 'System Administrator',
    role: Role.ADMIN,
    status: UserStatus.ACTIVE,
    isPremium: true,
    bio: 'Root user',
    levelOfEducation: LevelOfEducation.GRADUATE,
    country: 'United States',
    university: 'MIT',
  });

  // Normal User
  users.push({
    username: 'user',
    email: 'user@example.com',
    password: hashedPassword,
    fullName: 'Normal User',
    role: Role.USER,
    status: UserStatus.ACTIVE,
    isPremium: true,
    bio: 'Just a regular user',
    levelOfEducation: LevelOfEducation.GRADUATE,
    country: 'United States',
    university: 'MIT',
  });

  // Generate 50 Random Users
  for (let i = 0; i < 50; i++) {
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();

    const status = faker.helpers.weightedArrayElement([
      { weight: 80, value: UserStatus.ACTIVE },
      { weight: 10, value: UserStatus.PENDING_VERIFICATION },
      { weight: 5, value: UserStatus.BANNED },
      { weight: 5, value: UserStatus.SUSPENDED },
    ]);

    users.push({
      username: faker.internet.username({ firstName, lastName }) + `_${i}`,
      email: faker.internet.email({
        firstName,
        lastName,
        provider: 'example.com',
      }),
      password: hashedPassword,
      fullName: `${firstName} ${lastName}`,
      bio: faker.person.bio(),
      photoUrl: faker.image.avatar(),
      country: faker.location.country(),
      birthDate: faker.date.birthdate({ min: 18, max: 70, mode: 'age' }),
      levelOfEducation: faker.helpers.arrayElement(
        Object.values(LevelOfEducation),
      ),
      university: faker.helpers.arrayElement([
        faker.company.name() + ' University',
        null,
      ]),
      role: Role.USER,
      status: status,
      isPremium: faker.datatype.boolean({ probability: 0.2 }),
    });
  }

  await prisma.user.createMany({
    data: users,
    skipDuplicates: true,
  });

  logger.info('Users seeding completed successfully');
}
