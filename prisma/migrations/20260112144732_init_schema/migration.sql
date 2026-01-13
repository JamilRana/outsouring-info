-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUBMITTER', 'EXPORTER');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT,
    "role" "UserRole" NOT NULL,
    "facilityCode" TEXT,
    "facilityName" TEXT,
    "facilityType" TEXT,
    "division" TEXT,
    "district" TEXT,
    "upazila" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Submission" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "postName" TEXT NOT NULL,
    "consolidatedSalary" DOUBLE PRECISION NOT NULL,
    "totalPost" INTEGER NOT NULL,
    "male" INTEGER NOT NULL,
    "female" INTEGER NOT NULL,
    "totalManpower" INTEGER NOT NULL DEFAULT 0,
    "vacant" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "facilityCode" TEXT NOT NULL,
    "facilityName" TEXT NOT NULL,

    CONSTRAINT "Submission_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExportLog" (
    "id" TEXT NOT NULL,
    "exporterId" TEXT NOT NULL,
    "exportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "filters" JSONB,

    CONSTRAINT "ExportLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");

-- CreateIndex
CREATE INDEX "User_facilityCode_idx" ON "User"("facilityCode");

-- CreateIndex
CREATE INDEX "Submission_userId_idx" ON "Submission"("userId");

-- CreateIndex
CREATE INDEX "Submission_facilityCode_idx" ON "Submission"("facilityCode");

-- CreateIndex
CREATE INDEX "Submission_submittedAt_idx" ON "Submission"("submittedAt");

-- CreateIndex
CREATE INDEX "ExportLog_exporterId_idx" ON "ExportLog"("exporterId");

-- AddForeignKey
ALTER TABLE "Submission" ADD CONSTRAINT "Submission_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExportLog" ADD CONSTRAINT "ExportLog_exporterId_fkey" FOREIGN KEY ("exporterId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
