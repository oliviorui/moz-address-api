import "dotenv/config";

import {
  readdir,
  readFile
} from "node:fs/promises";

import path from "node:path";

import {
  fileURLToPath
} from "node:url";

import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

import {
  LocalityType,
  PrismaClient,
  SourceType
} from "../src/generated/prisma/client.js";

type SourceSeedRecord = {
  id: string;
  institution: string;
  title: string;
  type: "OFFICIAL" | "SECONDARY";
  year: number | null;
  url: string | null;
  accessedAt: string | null;
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

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

const rootDir =
  path.resolve(__dirname, "..");

async function readJsonArrays<T>(
  directory: string
): Promise<T[]> {
  let entries;

  try {
    entries = await readdir(
      directory,
      {
        withFileTypes: true
      }
    );
  } catch (error) {
    if (
      error instanceof Error &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      return [];
    }

    throw error;
  }

  const jsonFiles =
    entries
      .filter(
        (entry) =>
          entry.isFile() &&
          entry.name.endsWith(".json")
      )
      .sort(
        (a, b) =>
          a.name.localeCompare(
            b.name
          )
      );

  const records: T[] = [];

  for (const file of jsonFiles) {
    const content =
      await readFile(
        path.join(
          directory,
          file.name
        ),
        "utf8"
      );

    const parsed =
      JSON.parse(content) as T[];

    records.push(...parsed);
  }

  return records;
}

const connectionString =
  process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error(
    "DATABASE_URL is not defined."
  );
}

const pool = new Pool({
  connectionString
});

const adapter =
  new PrismaPg(pool);

const prisma =
  new PrismaClient({
    adapter
  });

async function main() {
  const sourceRecords =
    await readJsonArrays<SourceSeedRecord>(
      path.join(
        rootDir,
        "data",
        "sources",
        "sources-by-area"
      )
    );

  const localityRecords =
    await readJsonArrays<LocalitySeedRecord>(
      path.join(
        rootDir,
        "data",
        "current",
        "localities-by-area"
      )
    );

  const localitySourceRecords =
    await readJsonArrays<LocalitySourceSeedRecord>(
      path.join(
        rootDir,
        "data",
        "sources",
        "locality-sources-by-area"
      )
    );

  console.log(
    "🌍 Seeding locality data shards..."
  );

  for (const source of sourceRecords) {
    await prisma.source.upsert({
      where: {
        id: source.id
      },

      update: {
        institution:
          source.institution,
        title:
          source.title,
        type:
          source.type === "SECONDARY"
            ? SourceType.SECONDARY
            : SourceType.OFFICIAL,
        year:
          source.year,
        url:
          source.url,
        accessedAt:
          source.accessedAt
            ? new Date(
                source.accessedAt
              )
            : null,
        notes:
          source.notes
      },

      create: {
        id:
          source.id,
        institution:
          source.institution,
        title:
          source.title,
        type:
          source.type === "SECONDARY"
            ? SourceType.SECONDARY
            : SourceType.OFFICIAL,
        year:
          source.year,
        url:
          source.url,
        accessedAt:
          source.accessedAt
            ? new Date(
                source.accessedAt
              )
            : null,
        notes:
          source.notes
      }
    });
  }

  for (
    const locality of
    localityRecords
  ) {
    const type =
      locality.type ===
        "NEIGHBORHOOD"
        ? LocalityType.NEIGHBORHOOD
        : LocalityType.LOCALITY;

    await prisma.locality.upsert({
      where: {
        id: locality.id
      },

      update: {
        code:
          locality.code,
        name:
          locality.name,
        slug:
          locality.slug,
        type,
        administrativePostId:
          locality
            .administrativePostId,
        districtId:
          locality.districtId
      },

      create: {
        id:
          locality.id,
        code:
          locality.code,
        name:
          locality.name,
        slug:
          locality.slug,
        type,
        administrativePostId:
          locality
            .administrativePostId,
        districtId:
          locality.districtId
      }
    });
  }

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
          reference.page,
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
          reference.page,
        notes:
          reference.notes,
        verifiedAt:
          new Date()
      }
    });
  }

  console.log(
    `✅ ${sourceRecords.length} shard source(s), ${localityRecords.length} locality/neighborhood record(s), and ${localitySourceRecords.length} source link(s) seeded.`
  );
}

main()
  .catch((error) => {
    console.error(
      "❌ Locality shard seed failed:"
    );

    console.error(error);

    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
