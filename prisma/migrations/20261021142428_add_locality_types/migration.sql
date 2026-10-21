/*
  Warnings:

  - A unique constraint covering the columns `[districtId,slug]` on the table `localities` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "LocalityType" AS ENUM ('LOCALITY', 'NEIGHBORHOOD');

-- AlterTable
ALTER TABLE "localities" ADD COLUMN     "districtId" TEXT,
ADD COLUMN     "type" "LocalityType" NOT NULL DEFAULT 'LOCALITY',
ALTER COLUMN "administrativePostId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "localities_districtId_idx" ON "localities"("districtId");

-- CreateIndex
CREATE INDEX "localities_type_idx" ON "localities"("type");

-- CreateIndex
CREATE UNIQUE INDEX "localities_districtId_slug_key" ON "localities"("districtId", "slug");

-- AddForeignKey
ALTER TABLE "localities" ADD CONSTRAINT "localities_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
