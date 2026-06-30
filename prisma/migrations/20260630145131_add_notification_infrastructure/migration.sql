-- CreateEnum
CREATE TYPE "NotificationType" AS ENUM ('FOLLOW', 'READING_LIST_SAVED', 'COMMENT', 'REPLY', 'MENTION', 'VOTE_DISCUSSION', 'VOTE_COMMENT', 'WEEKLY_DIGEST');

-- CreateTable
CREATE TABLE "DeviceFcmToken" (
    "id" UUID NOT NULL,
    "userId" UUID NOT NULL,
    "token" TEXT NOT NULL,
    "deviceId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DeviceFcmToken_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Notification" (
    "id" UUID NOT NULL,
    "recipientId" UUID NOT NULL,
    "actorId" UUID,
    "type" "NotificationType" NOT NULL,
    "isRead" BOOLEAN NOT NULL DEFAULT false,
    "jobId" TEXT,
    "metadata" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "DeviceFcmToken_userId_idx" ON "DeviceFcmToken"("userId");

-- CreateIndex
CREATE INDEX "DeviceFcmToken_updatedAt_idx" ON "DeviceFcmToken"("updatedAt");

-- CreateIndex
CREATE UNIQUE INDEX "DeviceFcmToken_userId_token_key" ON "DeviceFcmToken"("userId", "token");

-- CreateIndex
CREATE UNIQUE INDEX "Notification_jobId_key" ON "Notification"("jobId");

-- CreateIndex
CREATE INDEX "Notification_recipientId_idx" ON "Notification"("recipientId");

-- CreateIndex
CREATE INDEX "Notification_recipientId_isRead_idx" ON "Notification"("recipientId", "isRead");

-- CreateIndex
CREATE INDEX "Notification_recipientId_createdAt_idx" ON "Notification"("recipientId", "createdAt");

-- AddForeignKey
ALTER TABLE "DeviceFcmToken" ADD CONSTRAINT "DeviceFcmToken_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_recipientId_fkey" FOREIGN KEY ("recipientId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
