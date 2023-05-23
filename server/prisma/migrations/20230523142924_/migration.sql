/*
  Warnings:

  - You are about to drop the column `email` on the `Review` table. All the data in the column will be lost.
  - You are about to drop the column `emailedAt` on the `Review` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Review" DROP COLUMN "email",
DROP COLUMN "emailedAt",
ADD COLUMN     "reviewerEmail" TEXT,
ADD COLUMN     "songCreatorEmailedAt" TIMESTAMP(3);
