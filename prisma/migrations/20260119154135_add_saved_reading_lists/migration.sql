-- CreateTable
CREATE TABLE "SavedReadingList" (
    "userId" UUID NOT NULL,
    "readingListId" UUID NOT NULL,
    "savedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SavedReadingList_pkey" PRIMARY KEY ("userId","readingListId")
);

-- CreateIndex
CREATE INDEX "SavedReadingList_userId_idx" ON "SavedReadingList"("userId");

-- AddForeignKey
ALTER TABLE "SavedReadingList" ADD CONSTRAINT "SavedReadingList_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedReadingList" ADD CONSTRAINT "SavedReadingList_readingListId_fkey" FOREIGN KEY ("readingListId") REFERENCES "ReadingList"("id") ON DELETE CASCADE ON UPDATE CASCADE;
