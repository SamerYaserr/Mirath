-- CreateTable
CREATE TABLE "recommendation_interests" (
    "settingsId" UUID NOT NULL,
    "interestId" UUID NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recommendation_interests_pkey" PRIMARY KEY ("settingsId","interestId")
);

-- CreateIndex
CREATE INDEX "recommendation_interests_settingsId_idx" ON "recommendation_interests"("settingsId");

-- CreateIndex
CREATE INDEX "recommendation_interests_interestId_idx" ON "recommendation_interests"("interestId");

-- AddForeignKey
ALTER TABLE "recommendation_interests" ADD CONSTRAINT "recommendation_interests_settingsId_fkey" FOREIGN KEY ("settingsId") REFERENCES "UserSettings"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recommendation_interests" ADD CONSTRAINT "recommendation_interests_interestId_fkey" FOREIGN KEY ("interestId") REFERENCES "Interest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
