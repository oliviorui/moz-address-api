-- CreateEnum
CREATE TYPE "NameEvidence" AS ENUM ('CURRENT_SOURCE', 'HISTORICAL_SOURCE_COUNT_CONFIRMED', 'HISTORICAL_SOURCE_ONLY');

-- CreateEnum
CREATE TYPE "ReferenceSupport" AS ENUM ('NAME', 'COUNT');

-- CreateEnum
CREATE TYPE "CoverageStatus" AS ENUM ('COMPLETE', 'PARTIAL');

-- AlterTable
ALTER TABLE "localities" ADD COLUMN     "nameEvidence" "NameEvidence";

-- AlterTable
ALTER TABLE "locality_sources" ADD COLUMN     "supports" "ReferenceSupport";

-- AlterTable
ALTER TABLE "sources" ADD COLUMN     "isHistorical" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "province_coverage" (
    "provinceId" TEXT NOT NULL,
    "status" "CoverageStatus" NOT NULL,
    "expectedAdministrativePosts" INTEGER,
    "expectedLocalities" INTEGER,
    "expectedNeighborhoods" INTEGER,
    "blockers" JSONB NOT NULL,
    "notes" TEXT[],
    "sourceIds" TEXT[],

    CONSTRAINT "province_coverage_pkey" PRIMARY KEY ("provinceId")
);

-- CreateIndex
CREATE INDEX "localities_nameEvidence_idx" ON "localities"("nameEvidence");

-- AddForeignKey
ALTER TABLE "province_coverage" ADD CONSTRAINT "province_coverage_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "provinces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

