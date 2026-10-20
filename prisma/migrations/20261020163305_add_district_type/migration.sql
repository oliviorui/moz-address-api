-- CreateEnum
CREATE TYPE "DistrictType" AS ENUM ('DISTRICT', 'MUNICIPAL_DISTRICT');

-- AlterTable
ALTER TABLE "districts" ADD COLUMN     "type" "DistrictType" NOT NULL DEFAULT 'DISTRICT';
