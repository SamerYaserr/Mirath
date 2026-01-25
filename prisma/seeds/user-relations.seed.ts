import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { winstonLogger as logger } from '../../src/config/logger.config';

export async function seedUserRelations(prisma: PrismaClient) {
  logger.info('Seeding User Relations...');

  const users = await prisma.user.findMany({ select: { id: true } });
  const interests = await prisma.interest.findMany({ select: { id: true } });
  const fields = await prisma.fieldOfStudy.findMany({ select: { id: true } });

  if (users.length === 0) return;

  const userInterestsData = [];
  const userFieldsData = [];
  const followsData = [];
  const searchHistoryData = [];

  for (const user of users) {
    // Assign 3-8 Interests per user
    const randomInterests = faker.helpers.arrayElements(interests, {
      min: 3,
      max: 8,
    });
    for (const interest of randomInterests) {
      userInterestsData.push({ userId: user.id, interestId: interest.id });
    }

    // Assign 1-3 Fields per user
    const randomFields = faker.helpers.arrayElements(fields, {
      min: 1,
      max: 3,
    });
    for (const field of randomFields) {
      userFieldsData.push({ userId: user.id, fieldId: field.id });
    }

    // Follow 2-10 random users
    const potentialFollowings = users.filter((u) => u.id !== user.id);
    const randomFollowing = faker.helpers.arrayElements(potentialFollowings, {
      min: 2,
      max: 10,
    });
    for (const following of randomFollowing) {
      followsData.push({ followerId: user.id, followingId: following.id });
    }

    // Create 5-10 Search History entries
    const searchCount = faker.number.int({ min: 5, max: 10 });
    for (let k = 0; k < searchCount; k++) {
      searchHistoryData.push({
        userId: user.id,
        query: faker.helpers.arrayElement([
          faker.science.chemicalElement().name,
          faker.hacker.noun(),
          faker.company.buzzPhrase(),
        ]),
        createdAt: faker.date.recent({ days: 60 }),
      });
    }
  }

  // Batch insert
  await prisma.userInterest.createMany({
    data: userInterestsData,
    skipDuplicates: true,
  });
  await prisma.userField.createMany({
    data: userFieldsData,
    skipDuplicates: true,
  });
  await prisma.follows.createMany({ data: followsData, skipDuplicates: true });
  await prisma.searchHistory.createMany({ data: searchHistoryData });

  logger.info('User relations seeding completed successfully');
}
