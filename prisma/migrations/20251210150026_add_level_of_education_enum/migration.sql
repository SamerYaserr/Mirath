/*
  Warnings:

  - The `levelOfEducation` column on the `User` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- CreateEnum
CREATE TYPE "LevelOfEducation" AS ENUM ('HIGH_SCHOOL', 'UNDERGRADUATE', 'GRADUATE');

-- AlterTable
ALTER TABLE "User" DROP COLUMN "levelOfEducation",
ADD COLUMN     "levelOfEducation" "LevelOfEducation";
