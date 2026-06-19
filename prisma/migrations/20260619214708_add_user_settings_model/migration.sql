-- CreateEnum
CREATE TYPE "ColorMode" AS ENUM ('LIGHT', 'DARK', 'SYSTEM');

-- CreateEnum
CREATE TYPE "FontSize" AS ENUM ('SMALL', 'MEDIUM', 'LARGE', 'EXTRA_LARGE');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "scheduledDeletionAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "UserSettings" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "showRecommendedPapers" BOOLEAN NOT NULL DEFAULT true,
    "hideAlreadyReadPapers" BOOLEAN NOT NULL DEFAULT false,
    "saveSearchHistory" BOOLEAN NOT NULL DEFAULT true,
    "colorMode" "ColorMode" NOT NULL DEFAULT 'SYSTEM',
    "defaultFontSize" "FontSize" NOT NULL DEFAULT 'MEDIUM',
    "defaultReadingListVisibility" BOOLEAN NOT NULL DEFAULT true,
    "annotationHighlightColors" TEXT[],
    "notifyNewPapersInField" BOOLEAN NOT NULL DEFAULT true,
    "notifyReadingListActivity" BOOLEAN NOT NULL DEFAULT true,
    "notifyNewFollowers" BOOLEAN NOT NULL DEFAULT true,
    "notifyDiscussionReplies" BOOLEAN NOT NULL DEFAULT true,
    "notifyCommentMentions" BOOLEAN NOT NULL DEFAULT true,
    "notifyVotesOnContent" BOOLEAN NOT NULL DEFAULT true,
    "isPrivateAccount" BOOLEAN NOT NULL DEFAULT false,
    "allowProfileSearch" BOOLEAN NOT NULL DEFAULT true,
    "allowPublicComments" BOOLEAN NOT NULL DEFAULT true,
    "useReadingBehaviorForRecommendations" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "UserSettings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "UserSettings_userId_key" ON "UserSettings"("userId");

-- AddForeignKey
ALTER TABLE "UserSettings" ADD CONSTRAINT "UserSettings_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
