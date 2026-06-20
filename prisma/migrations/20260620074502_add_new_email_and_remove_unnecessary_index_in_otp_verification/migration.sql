-- DropIndex
DROP INDEX "OtpVerification_otpCode_idx";

-- AlterTable
ALTER TABLE "OtpVerification" ADD COLUMN     "newEmail" TEXT;
