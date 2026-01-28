import { PrismaClient, VoteType } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { winstonLogger as logger } from '../../src/config/logger.config';

export async function seedDiscussions(prisma: PrismaClient) {
  logger.info('Seeding Discussions...');

  const users = await prisma.user.findMany({ select: { id: true } });
  const interests = await prisma.interest.findMany({ select: { id: true } });
  const papers = await prisma.paper.findMany({
    take: 50,
    select: { id: true },
  });

  if (users.length === 0) return;

  let createdCount = 0;

  for (let i = 0; i < 50; i++) {
    const author = faker.helpers.arrayElement(users);

    // Link to 0-3 papers
    const linkedPapers = faker.helpers
      .arrayElements(papers, { min: 0, max: 3 })
      .map((p) => p.id);

    const discussion = await prisma.discussion.create({
      data: {
        title: faker.lorem.sentence({ min: 4, max: 10 }),
        content: faker.lorem.paragraphs({ min: 2, max: 5 }),
        authorId: author.id,
        paperIds: linkedPapers,
        voteScore: faker.number.int({ min: 0, max: 100 }), // initial score
        createdAt: faker.date.past({ years: 1 }),
      },
    });

    // Add 1-4 Topics
    const topics = faker.helpers.arrayElements(interests, { min: 1, max: 4 });
    const topicData = topics.map((t) => ({
      discussionId: discussion.id,
      interestId: t.id,
    }));
    await prisma.discussionTopic.createMany({ data: topicData });

    // Add 5-20 Votes per discussion
    const voters = faker.helpers.arrayElements(users, { min: 5, max: 20 });
    const voteData = voters.map((v) => ({
      userId: v.id,
      discussionId: discussion.id,
      type: faker.helpers.arrayElement([
        VoteType.UP,
        VoteType.UP,
        VoteType.UP,
        VoteType.DOWN,
      ]), // Bias towards Up
    }));
    await prisma.discussionVote.createMany({ data: voteData });

    createdCount++;
  }

  logger.info('Discussions seeding completed successfully');
}
