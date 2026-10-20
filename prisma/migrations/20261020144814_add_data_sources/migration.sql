-- CreateEnum
CREATE TYPE "SourceType" AS ENUM ('OFFICIAL', 'SECONDARY');

-- CreateTable
CREATE TABLE "sources" (
    "id" TEXT NOT NULL,
    "institution" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "SourceType" NOT NULL DEFAULT 'OFFICIAL',
    "year" INTEGER,
    "url" TEXT,
    "accessedAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sources_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "province_sources" (
    "provinceId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "page" TEXT,
    "notes" TEXT,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "province_sources_pkey" PRIMARY KEY ("provinceId","sourceId")
);

-- CreateTable
CREATE TABLE "district_sources" (
    "districtId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "page" TEXT,
    "notes" TEXT,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "district_sources_pkey" PRIMARY KEY ("districtId","sourceId")
);

-- CreateTable
CREATE TABLE "administrative_post_sources" (
    "administrativePostId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "page" TEXT,
    "notes" TEXT,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "administrative_post_sources_pkey" PRIMARY KEY ("administrativePostId","sourceId")
);

-- CreateTable
CREATE TABLE "locality_sources" (
    "localityId" TEXT NOT NULL,
    "sourceId" TEXT NOT NULL,
    "page" TEXT,
    "notes" TEXT,
    "verifiedAt" TIMESTAMP(3),

    CONSTRAINT "locality_sources_pkey" PRIMARY KEY ("localityId","sourceId")
);

-- CreateIndex
CREATE INDEX "sources_institution_idx" ON "sources"("institution");

-- CreateIndex
CREATE INDEX "sources_year_idx" ON "sources"("year");

-- CreateIndex
CREATE INDEX "province_sources_sourceId_idx" ON "province_sources"("sourceId");

-- CreateIndex
CREATE INDEX "district_sources_sourceId_idx" ON "district_sources"("sourceId");

-- CreateIndex
CREATE INDEX "administrative_post_sources_sourceId_idx" ON "administrative_post_sources"("sourceId");

-- CreateIndex
CREATE INDEX "locality_sources_sourceId_idx" ON "locality_sources"("sourceId");

-- AddForeignKey
ALTER TABLE "province_sources" ADD CONSTRAINT "province_sources_provinceId_fkey" FOREIGN KEY ("provinceId") REFERENCES "provinces"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "province_sources" ADD CONSTRAINT "province_sources_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "district_sources" ADD CONSTRAINT "district_sources_districtId_fkey" FOREIGN KEY ("districtId") REFERENCES "districts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "district_sources" ADD CONSTRAINT "district_sources_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administrative_post_sources" ADD CONSTRAINT "administrative_post_sources_administrativePostId_fkey" FOREIGN KEY ("administrativePostId") REFERENCES "administrative_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "administrative_post_sources" ADD CONSTRAINT "administrative_post_sources_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locality_sources" ADD CONSTRAINT "locality_sources_localityId_fkey" FOREIGN KEY ("localityId") REFERENCES "localities"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "locality_sources" ADD CONSTRAINT "locality_sources_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "sources"("id") ON DELETE CASCADE ON UPDATE CASCADE;
