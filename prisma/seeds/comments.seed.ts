import { PrismaClient, VoteType } from '@prisma/client';
import { faker } from '@faker-js/faker';
import { winstonLogger as logger } from '../../src/config/logger.config';

export async function seedComments(prisma: PrismaClient) {
  logger.info('Seeding Comments...');

  const users = await prisma.user.findMany({ select: { id: true } });
  const discussions = await prisma.discussion.findMany({
    select: { id: true },
  });

  if (discussions.length === 0 || users.length === 0) return;

  for (const discussion of discussions) {
    let discussionCommentCount = 0;

    // Generate 5 to 15 comments per discussion
    const targetCount = faker.number.int({ min: 5, max: 15 });

    for (let i = 0; i < targetCount; i++) {
      const author = faker.helpers.arrayElement(users);

      const comment = await prisma.comment.create({
        data: {
          content: faker.lorem.sentences({ min: 1, max: 3 }),
          discussionId: discussion.id,
          authorId: author.id,
          voteScore: faker.number.int({ min: 0, max: 20 }),
        },
      });
      discussionCommentCount++;

      // 30% chance of a reply
      if (faker.datatype.boolean({ probability: 0.3 })) {
        const replyAuthor = faker.helpers.arrayElement(users);
        await prisma.comment.create({
          data: {
            content: faker.lorem.sentence(),
            discussionId: discussion.id,
            authorId: replyAuthor.id,
            parentId: comment.id,
          },
        });
        discussionCommentCount++;
      }

      // Add 0-5 votes per comment
      const voters = faker.helpers.arrayElements(users, { min: 0, max: 5 });
      const voteData = voters.map((v) => ({
        userId: v.id,
        commentId: comment.id,
        type: faker.helpers.arrayElement([VoteType.UP, VoteType.DOWN]),
      }));
      await prisma.commentVote.createMany({ data: voteData });
    }

    await prisma.discussion.update({
      where: { id: discussion.id },
      data: {
        commentCount: { increment: discussionCommentCount },
      },
    });
  }

  logger.info('Comments seeding completed successfully');
}
