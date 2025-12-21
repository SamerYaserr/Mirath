-- CreateTable
CREATE TABLE "Interest" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "Interest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserInterest" (
    "userId" UUID NOT NULL,
    "interestId" UUID NOT NULL,

    CONSTRAINT "UserInterest_pkey" PRIMARY KEY ("userId","interestId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Interest_name_key" ON "Interest"("name");

-- CreateIndex
CREATE INDEX "Interest_name_idx" ON "Interest"("name");

-- CreateIndex
CREATE INDEX "UserInterest_userId_idx" ON "UserInterest"("userId");

-- CreateIndex
CREATE INDEX "UserInterest_interestId_idx" ON "UserInterest"("interestId");

-- AddForeignKey
ALTER TABLE "UserInterest" ADD CONSTRAINT "UserInterest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserInterest" ADD CONSTRAINT "UserInterest_interestId_fkey" FOREIGN KEY ("interestId") REFERENCES "Interest"("id") ON DELETE CASCADE ON UPDATE CASCADE;
