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

      // --- Prepare Votes for Main Comment ---
      const voters = faker.helpers.arrayElements(users, { min: 0, max: 5 });
      const votesData = voters.map((v) => ({
        userId: v.id,
        type: faker.helpers.arrayElement([VoteType.UP, VoteType.DOWN]),
      }));

      const upvoteCount = votesData.filter(
        (v) => v.type === VoteType.UP,
      ).length;
      const downvoteCount = votesData.filter(
        (v) => v.type === VoteType.DOWN,
      ).length;

      // --- Create Comment ---
      const comment = await prisma.comment.create({
        data: {
          content: faker.lorem.sentences({ min: 1, max: 3 }),
          discussionId: discussion.id,
          authorId: author.id,
          upvoteCount,
          downvoteCount,
        },
      });
      discussionCommentCount++;

      // --- Insert Votes ---
      if (votesData.length > 0) {
        await prisma.commentVote.createMany({
          data: votesData.map((v) => ({
            userId: v.userId,
            commentId: comment.id,
            type: v.type,
          })),
        });
      }

      // --- Handle Reply (30% chance) ---
      if (faker.datatype.boolean({ probability: 0.3 })) {
        const replyAuthor = faker.helpers.arrayElement(users);

        // Prepare votes for reply
        const replyVoters = faker.helpers.arrayElements(users, {
          min: 0,
          max: 3,
        });
        const replyVotesData = replyVoters.map((v) => ({
          userId: v.id,
          type: faker.helpers.arrayElement([VoteType.UP, VoteType.DOWN]),
        }));

        const replyUp = replyVotesData.filter(
          (v) => v.type === VoteType.UP,
        ).length;
        const replyDown = replyVotesData.filter(
          (v) => v.type === VoteType.DOWN,
        ).length;

        const reply = await prisma.comment.create({
          data: {
            content: faker.lorem.sentence(),
            discussionId: discussion.id,
            authorId: replyAuthor.id,
            parentId: comment.id,
            upvoteCount: replyUp,
            downvoteCount: replyDown,
          },
        });
        discussionCommentCount++;

        if (replyVotesData.length > 0) {
          await prisma.commentVote.createMany({
            data: replyVotesData.map((v) => ({
              userId: v.userId,
              commentId: reply.id,
              type: v.type,
            })),
          });
        }
      }
    }

    // Update Discussion total comment count
    await prisma.discussion.update({
      where: { id: discussion.id },
      data: {
        commentCount: { increment: discussionCommentCount },
      },
    });
  }

  logger.info('Comments seeding completed successfully');
}
