/*
  Warnings:

  - You are about to drop the column `paperIds` on the `Discussion` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Discussion" DROP COLUMN "paperIds";

-- CreateTable
CREATE TABLE "_DiscussionToPaper" (
    "A" UUID NOT NULL,
    "B" UUID NOT NULL,

    CONSTRAINT "_DiscussionToPaper_AB_pkey" PRIMARY KEY ("A","B")
);

-- CreateIndex
CREATE INDEX "_DiscussionToPaper_B_index" ON "_DiscussionToPaper"("B");

-- AddForeignKey
ALTER TABLE "_DiscussionToPaper" ADD CONSTRAINT "_DiscussionToPaper_A_fkey" FOREIGN KEY ("A") REFERENCES "Discussion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "_DiscussionToPaper" ADD CONSTRAINT "_DiscussionToPaper_B_fkey" FOREIGN KEY ("B") REFERENCES "Paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;
