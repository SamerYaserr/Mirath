/*
  Warnings:

  - You are about to drop the column `voteScore` on the `Comment` table. All the data in the column will be lost.
  - You are about to drop the column `voteScore` on the `Discussion` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "Discussion_voteScore_idx";

-- AlterTable
ALTER TABLE "Comment" DROP COLUMN "voteScore",
ADD COLUMN     "downvoteCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "upvoteCount" INTEGER NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "Discussion" DROP COLUMN "voteScore",
ADD COLUMN     "downvoteCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "upvoteCount" INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX "Discussion_upvoteCount_idx" ON "Discussion"("upvoteCount");

-- CreateIndex
CREATE INDEX "Discussion_commentCount_idx" ON "Discussion"("commentCount");
