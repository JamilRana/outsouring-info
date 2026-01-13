/*
  Warnings:

  - You are about to drop the column `postName` on the `Submission` table. All the data in the column will be lost.
  - Added the required column `designationId` to the `Submission` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "Submission" DROP COLUMN "postName",
ADD COLUMN     "designationId" TEXT NOT NULL;

-- CreateTable
CREATE TABLE "designation_tbl" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "designation_tbl_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "designation_tbl_name_key" ON "designation_tbl"("name");

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_designationId_fkey" FOREIGN KEY ("designationId") REFERENCES "designation_tbl"("id") ON DELETE CASCADE ON UPDATE CASCADE;
