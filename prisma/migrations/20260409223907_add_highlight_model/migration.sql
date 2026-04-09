-- CreateEnum
CREATE TYPE "HighlightColor" AS ENUM ('YELLOW', 'GREEN', 'BLUE', 'PURPLE', 'PINK', 'RED');

-- CreateTable
CREATE TABLE "Highlight" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "paperId" UUID NOT NULL,
    "color" "HighlightColor" NOT NULL DEFAULT 'YELLOW',
    "note" TEXT,
    "xpathStart" TEXT NOT NULL,
    "xpathEnd" TEXT NOT NULL,
    "startOffset" INTEGER NOT NULL,
    "endOffset" INTEGER NOT NULL,
    "selectedText" TEXT NOT NULL,
    "plainText" TEXT,
    "htmlContent" TEXT,
    "contextBefore" TEXT,
    "contextAfter" TEXT,
    "firstWord" TEXT,
    "lastWord" TEXT,
    "selectedWordCount" INTEGER,
    "selectedCharLength" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Highlight_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Highlight_userId_paperId_idx" ON "Highlight"("userId", "paperId");

-- CreateIndex
CREATE INDEX "Highlight_userId_paperId_createdAt_idx" ON "Highlight"("userId", "paperId", "createdAt");

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Highlight" ADD CONSTRAINT "Highlight_paperId_fkey" FOREIGN KEY ("paperId") REFERENCES "Paper"("id") ON DELETE CASCADE ON UPDATE CASCADE;
