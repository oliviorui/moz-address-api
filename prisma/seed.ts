import "dotenv/config";

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

import provinces from "../data/current/provinces.json" with {
  type: "json"
};

import districts from "../data/current/districts.json" with {
  type: "json"
};

import sources from "../data/sources/sources.json" with {
  type: "json"
};

import districtSources from "../data/sources/district-sources.json" with {
  type: "json"
};

import {
  PrismaClient,
  ProvinceType,
  SourceType
} from "../src/generated/prisma/client.js";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is not defined.");
}

const pool = new Pool({
  connectionString
});

const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({
  adapter
});

async function seedSources() {
  console.log("📚 Seeding data sources...");

  for (const source of sources) {
    await prisma.source.upsert({
      where: {
        id: source.id
      },

      update: {
        institution: source.institution,
        title: source.title,

        type:
          source.type === "SECONDARY"
            ? SourceType.SECONDARY
            : SourceType.OFFICIAL,

        year: source.year,
        url: source.url,

        accessedAt: source.accessedAt
          ? new Date(source.accessedAt)
          : null,

        notes: source.notes
      },

      create: {
        id: source.id,
        institution: source.institution,
        title: source.title,

        type:
          source.type === "SECONDARY"
            ? SourceType.SECONDARY
            : SourceType.OFFICIAL,

        year: source.year,
        url: source.url,

        accessedAt: source.accessedAt
          ? new Date(source.accessedAt)
          : null,

        notes: source.notes
      }
    });
  }

  console.log(`✅ ${sources.length} source(s) available.`);
}

async function seedProvinces() {
  console.log("🗺️ Seeding provinces...");

  for (const province of provinces) {
    await prisma.province.upsert({
      where: {
        id: province.id
      },

      update: {
        code: province.code,
        name: province.name,
        slug: province.slug,
        capital: province.capital,

        type:
          province.type === "capital-city"
            ? ProvinceType.CAPITAL_CITY
            : ProvinceType.PROVINCE
      },

      create: {
        id: province.id,
        code: province.code,
        name: province.name,
        slug: province.slug,
        capital: province.capital,

        type:
          province.type === "capital-city"
            ? ProvinceType.CAPITAL_CITY
            : ProvinceType.PROVINCE
      }
    });
  }

  const count = await prisma.province.count();

  console.log(`✅ ${count} province(s) available.`);
}

async function seedDistricts() {
  console.log("📍 Seeding districts...");

  for (const district of districts) {
    await prisma.district.upsert({
      where: {
        id: district.id
      },

      update: {
        code: district.code,
        name: district.name,
        slug: district.slug,
        provinceId: district.provinceId
      },

      create: {
        id: district.id,
        code: district.code,
        name: district.name,
        slug: district.slug,
        provinceId: district.provinceId
      }
    });
  }

  const count = await prisma.district.count();

  console.log(`✅ ${count} district(s) available.`);
}

async function seedDistrictSources() {
  console.log("🔗 Linking districts to sources...");

  for (const reference of districtSources) {
    await prisma.districtSource.upsert({
      where: {
        districtId_sourceId: {
          districtId: reference.districtId,
          sourceId: reference.sourceId
        }
      },

      update: {
        page: reference.page ?? null,
        notes: reference.notes,
        verifiedAt: new Date()
      },

      create: {
        districtId: reference.districtId,
        sourceId: reference.sourceId,
        page: reference.page ?? null,
        notes: reference.notes,
        verifiedAt: new Date()
      }
    });
  }

  console.log(
    `✅ ${districtSources.length} district source reference(s) available.`
  );
}

async function main() {
  console.log("🌱 Starting database seed...\n");

  await seedSources();
  await seedProvinces();
  await seedDistricts();
  await seedDistrictSources();

  console.log("\n🌱 Database seed completed.");
}

main()
  .catch((error) => {
    console.error("❌ Seed failed:");
    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
  