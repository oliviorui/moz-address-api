import "dotenv/config";

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

import provinces from "../data/current/provinces.json" with {
  type: "json"
};

import districts from "../data/current/districts.json" with {
  type: "json"
};

import administrativePosts from "../data/current/administrative-posts.json" with {
  type: "json"
};

import sources from "../data/sources/sources.json" with {
  type: "json"
};

import districtSources from "../data/sources/district-sources.json" with {
  type: "json"
};

import administrativePostSources from "../data/sources/administrative-post-sources.json" with {
  type: "json"
};

import localities from "../data/current/localities.json" with {
  type: "json"
};

import localitySources from "../data/sources/locality-sources.json" with {
  type: "json"
};

import {
  PrismaClient,
  ProvinceType,
  SourceType,
  DistrictType,
  LocalityType
} from "../src/generated/prisma/client.js";

type AdministrativePostSeedRecord = {
  id: string;
  code: string | null;
  name: string;
  slug: string;
  districtId: string;
};

type AdministrativePostSourceSeedRecord = {
  administrativePostId: string;
  sourceId: string;
  page: string | null;
  notes: string | null;
};

type LocalitySeedRecord = {
  id: string;
  code: string | null;
  name: string;
  slug: string;
  type: "LOCALITY" | "NEIGHBORHOOD";
  administrativePostId: string | null;
  districtId: string | null;
};

type LocalitySourceSeedRecord = {
  localityId: string;
  sourceId: string;
  page: string | null;
  notes: string | null;
};

const localityRecords =
  localities as LocalitySeedRecord[];

const localitySourceRecords =
  localitySources as LocalitySourceSeedRecord[];

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

const administrativePostRecords =
  administrativePosts as AdministrativePostSeedRecord[];

const administrativePostSourceRecords =
  administrativePostSources as AdministrativePostSourceSeedRecord[];

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

  console.log(
    `✅ ${sources.length} source(s) available.`
  );
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

  console.log(
    `✅ ${count} province(s) available.`
  );
}

async function seedDistricts() {
  console.log("📍 Seeding districts...");

  for (const district of districts) {
    const type =
      "type" in district &&
      district.type === "MUNICIPAL_DISTRICT"
        ? DistrictType.MUNICIPAL_DISTRICT
        : DistrictType.DISTRICT;

    await prisma.district.upsert({
      where: {
        id: district.id
      },

      update: {
        code: district.code,
        name: district.name,
        slug: district.slug,
        provinceId: district.provinceId,
        type
      },

      create: {
        id: district.id,
        code: district.code,
        name: district.name,
        slug: district.slug,
        provinceId: district.provinceId,
        type
      }
    });
  }

  const count = await prisma.district.count();

  console.log(
    `✅ ${count} district(s) available.`
  );
}

async function seedAdministrativePosts() {
  console.log(
    "🏘️ Seeding administrative posts..."
  );

  const canonicalIds =
    administrativePostRecords.map(
      (post) => post.id
    );

  // Remove stale source links and obsolete administrative posts
  // that no longer exist in the canonical dataset. This prevents
  // renamed posts from surviving as "ghost" rows after an upsert seed.
  const stalePosts =
    await prisma.administrativePost.findMany({
      where: {
        id: {
          notIn: canonicalIds
        }
      },
      select: {
        id: true
      }
    });

  if (stalePosts.length > 0) {
    const staleIds =
      stalePosts.map((post) => post.id);

    const blockingLocalities =
      await prisma.locality.count({
        where: {
          administrativePostId: {
            in: staleIds
          }
        }
      });

    if (blockingLocalities > 0) {
      throw new Error(
        `Cannot remove ${staleIds.length} stale administrative post(s): ${blockingLocalities} locality record(s) still reference them.`
      );
    }

    await prisma.administrativePostSource.deleteMany({
      where: {
        administrativePostId: {
          in: staleIds
        }
      }
    });

    await prisma.administrativePost.deleteMany({
      where: {
        id: {
          in: staleIds
        }
      }
    });

    console.log(
      `🧹 Removed ${staleIds.length} stale administrative post(s).`
    );
  }

  for (const post of administrativePostRecords) {
    await prisma.administrativePost.upsert({
      where: {
        id: post.id
      },

      update: {
        code: post.code,
        name: post.name,
        slug: post.slug,
        districtId: post.districtId
      },

      create: {
        id: post.id,
        code: post.code,
        name: post.name,
        slug: post.slug,
        districtId: post.districtId
      }
    });
  }

  const count =
    await prisma.administrativePost.count();

  console.log(
    `✅ ${count} administrative post(s) available.`
  );
}

async function seedLocalities() {
  console.log(
    "🏙️ Seeding localities and neighborhoods..."
  );

  for (
    const locality of localityRecords
  ) {
    const type =
      locality.type === "NEIGHBORHOOD"
        ? LocalityType.NEIGHBORHOOD
        : LocalityType.LOCALITY;

    await prisma.locality.upsert({
      where: {
        id: locality.id
      },

      update: {
        code: locality.code,
        name: locality.name,
        slug: locality.slug,
        type,
        administrativePostId:
          locality.administrativePostId,
        districtId:
          locality.districtId
      },

      create: {
        id: locality.id,
        code: locality.code,
        name: locality.name,
        slug: locality.slug,
        type,
        administrativePostId:
          locality.administrativePostId,
        districtId:
          locality.districtId
      }
    });
  }

  const count =
    await prisma.locality.count();

  console.log(
    `✅ ${count} locality/neighborhood record(s) available.`
  );
}

async function seedLocalitySources() {
  console.log(
    "🔗 Linking localities and neighborhoods to sources..."
  );

  for (
    const reference of
      localitySourceRecords
  ) {
    await prisma.localitySource.upsert({
      where: {
        localityId_sourceId: {
          localityId:
            reference.localityId,
          sourceId:
            reference.sourceId
        }
      },

      update: {
        page:
          reference.page ?? null,
        notes:
          reference.notes,
        verifiedAt:
          new Date()
      },

      create: {
        localityId:
          reference.localityId,
        sourceId:
          reference.sourceId,
        page:
          reference.page ?? null,
        notes:
          reference.notes,
        verifiedAt:
          new Date()
      }
    });
  }

  console.log(
    `✅ ${localitySourceRecords.length} locality source reference(s) available.`
  );
}

async function seedDistrictSources() {
  console.log(
    "🔗 Linking districts to sources..."
  );

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

async function seedAdministrativePostSources() {
  console.log(
    "🔗 Linking administrative posts to sources..."
  );

  for (
    const reference of administrativePostSourceRecords
  ) {
    await prisma.administrativePostSource.upsert({
      where: {
        administrativePostId_sourceId: {
          administrativePostId:
            reference.administrativePostId,
          sourceId:
            reference.sourceId
        }
      },

      update: {
        page: reference.page ?? null,
        notes: reference.notes,
        verifiedAt: new Date()
      },

      create: {
        administrativePostId:
          reference.administrativePostId,
        sourceId: reference.sourceId,
        page: reference.page ?? null,
        notes: reference.notes,
        verifiedAt: new Date()
      }
    });
  }

  console.log(
    `✅ ${administrativePostSourceRecords.length} administrative post source reference(s) available.`
  );
}

async function main() {
  console.log(
    "🌱 Starting database seed...\n"
  );

  await seedSources();

  await seedProvinces();

  await seedDistricts();

  await seedAdministrativePosts();

  await seedLocalities();

  await seedDistrictSources();

  await seedAdministrativePostSources();

  await seedLocalitySources();

  console.log(
    "\n🌱 Database seed completed."
  );
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
