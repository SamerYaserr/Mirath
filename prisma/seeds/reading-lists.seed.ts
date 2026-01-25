import { PrismaClient } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { winstonLogger as logger } from '../../src/config/logger.config';

export async function seedReadingLists(prisma: PrismaClient) {
  logger.info('Seeding Reading Lists...');

  const users = await prisma.user.findMany({ select: { id: true } });
  const papers = await prisma.paper.findMany({
    take: 100,
    select: { id: true },
  });

  if (users.length === 0 || papers.length === 0) return;

  const savedPapersData = [];
  const savedReadingListsData = [];

  for (const user of users) {
    // Save 5-15 random papers directly
    const userSavedPapers = faker.helpers.arrayElements(papers, {
      min: 5,
      max: 15,
    });
    for (const p of userSavedPapers) {
      savedPapersData.push({ userId: user.id, paperId: p.id });
    }

    // Create 1-4 Reading Lists per user
    const listCount = faker.number.int({ min: 1, max: 4 });

    for (let i = 0; i < listCount; i++) {
      const list = await prisma.readingList.create({
        data: {
          title:
            faker.helpers.arrayElement([
              'Thesis Prep',
              'Must Read',
              'AI Research',
              'Biology 101',
            ]) + ` ${i + 1}`,
          description: faker.lorem.sentence(),
          isPublic: faker.datatype.boolean(),
          ownerId: user.id,
        },
      });

      // Add 3-10 papers to this list
      const papersInList = faker.helpers.arrayElements(papers, {
        min: 3,
        max: 10,
      });
      const listPapersData = papersInList.map((p) => ({
        readingListId: list.id,
        paperId: p.id,
      }));
      await prisma.readingListPaper.createMany({ data: listPapersData });

      // 10% chance another user saves this list
      if (list.isPublic && faker.datatype.boolean({ probability: 0.1 })) {
        const otherUser = faker.helpers.arrayElement(
          users.filter((u) => u.id !== user.id),
        );
        if (otherUser) {
          savedReadingListsData.push({
            userId: otherUser.id,
            readingListId: list.id,
          });
        }
      }
    }
  }

  await prisma.savedPaper.createMany({
    data: savedPapersData,
    skipDuplicates: true,
  });
  await prisma.savedReadingList.createMany({
    data: savedReadingListsData,
    skipDuplicates: true,
  });

  logger.info('Reading lists seeding completed successfully');
}
