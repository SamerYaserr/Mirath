-- CreateTable
CREATE TABLE "FieldOfStudy" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,

    CONSTRAINT "FieldOfStudy_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UserField" (
    "userId" UUID NOT NULL,
    "fieldId" UUID NOT NULL,

    CONSTRAINT "UserField_pkey" PRIMARY KEY ("userId","fieldId")
);

-- CreateIndex
CREATE UNIQUE INDEX "FieldOfStudy_name_key" ON "FieldOfStudy"("name");

-- CreateIndex
CREATE INDEX "FieldOfStudy_name_idx" ON "FieldOfStudy"("name");

-- CreateIndex
CREATE INDEX "UserField_userId_idx" ON "UserField"("userId");

-- CreateIndex
CREATE INDEX "UserField_fieldId_idx" ON "UserField"("fieldId");

-- AddForeignKey
ALTER TABLE "UserField" ADD CONSTRAINT "UserField_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UserField" ADD CONSTRAINT "UserField_fieldId_fkey" FOREIGN KEY ("fieldId") REFERENCES "FieldOfStudy"("id") ON DELETE CASCADE ON UPDATE CASCADE;
