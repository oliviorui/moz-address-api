import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type Province = {
  id: string;
  code: string | null;
  name: string;
  slug: string;
  type: "province" | "capital-city";
  capital: string | null;
};

type District = {
  id: string;
  code: string | null;
  name: string;
  slug: string;
  provinceId: string;
  type?: "DISTRICT" | "MUNICIPAL_DISTRICT";
};

type Source = {
  id: string;
  institution: string;
  title: string;
  type: "OFFICIAL" | "SECONDARY";
  year: number | null;
  url: string | null;
  accessedAt: string | null;
  notes: string | null;
};

type DistrictSource = {
  districtId: string;
  sourceId: string;
  page: string | null;
  notes: string | null;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const paths = {
  provinces: path.join(
    rootDir,
    "data",
    "current",
    "provinces.json"
  ),
  districts: path.join(
    rootDir,
    "data",
    "current",
    "districts.json"
  ),
  sources: path.join(
    rootDir,
    "data",
    "sources",
    "sources.json"
  ),
  districtSources: path.join(
    rootDir,
    "data",
    "sources",
    "district-sources.json"
  )
};

const expectedDistrictCounts: Record<string, number> = {
  prov_01: 16, // Niassa
  prov_02: 17, // Cabo Delgado
  prov_03: 23, // Nampula
  prov_04: 22, // Zambézia
  prov_05: 15, // Tete
  prov_06: 12, // Manica
  prov_07: 13, // Sofala
  prov_08: 14, // Inhambane
  prov_09: 14, // Gaza
  prov_10: 8,  // Maputo Province
  prov_11: 7   // Maputo City
};

const errors: string[] = [];
const warnings: string[] = [];

async function readJson<T>(
  filePath: string
): Promise<T> {
  const content = await readFile(filePath, "utf8");

  return JSON.parse(content) as T;
}

function findDuplicates(
  values: string[]
): string[] {
  const counts = new Map<string, number>();

  for (const value of values) {
    counts.set(
      value,
      (counts.get(value) ?? 0) + 1
    );
  }

  return [...counts.entries()]
    .filter(([, count]) => count > 1)
    .map(([value]) => value);
}

function reportDuplicateValues(
  label: string,
  values: string[]
) {
  const duplicates = findDuplicates(values);

  for (const duplicate of duplicates) {
    errors.push(
      `${label} duplicated: "${duplicate}"`
    );
  }
}

function validateProvinceData(
  provinces: Province[]
) {
  console.log("🔎 Validating provinces...");

  if (provinces.length !== 11) {
    errors.push(
      `Expected 11 provinces, found ${provinces.length}.`
    );
  }

  reportDuplicateValues(
    "Province ID",
    provinces.map((province) => province.id)
  );

  reportDuplicateValues(
    "Province slug",
    provinces.map((province) => province.slug)
  );

  const provinceCodes = provinces
    .map((province) => province.code)
    .filter(
      (code): code is string => code !== null
    );

  reportDuplicateValues(
    "Province code",
    provinceCodes
  );

  for (const province of provinces) {
    if (!province.id.trim()) {
      errors.push(
        "Province found with empty ID."
      );
    }

    if (!province.name.trim()) {
      errors.push(
        `Province "${province.id}" has an empty name.`
      );
    }

    if (!province.slug.trim()) {
      errors.push(
        `Province "${province.id}" has an empty slug.`
      );
    }
  }

  console.log(
    `   ✅ ${provinces.length} province(s) checked.`
  );
}

function validateDistrictData(
  districts: District[],
  provinces: Province[]
) {
  console.log("🔎 Validating districts...");

  const provinceIds = new Set(
    provinces.map((province) => province.id)
  );

  if (districts.length !== 161) {
    errors.push(
      `Expected 161 districts/territorial equivalents, found ${districts.length}.`
    );
  }

  reportDuplicateValues(
    "District ID",
    districts.map((district) => district.id)
  );

  const districtCodes = districts
    .map((district) => district.code)
    .filter(
      (code): code is string => code !== null
    );

  reportDuplicateValues(
    "District code",
    districtCodes
  );

  /*
   * Our current endpoint:
   *
   * GET /api/v1/districts/:identifier
   *
   * resolves districts by ID OR slug without requiring
   * the province. Therefore district slugs must currently
   * be unique nationally.
   */
  reportDuplicateValues(
    "Global district slug",
    districts.map((district) => district.slug)
  );

  /*
   * This also checks the database-level logical constraint:
   *
   * @@unique([provinceId, slug])
   */
  reportDuplicateValues(
    "District province/slug pair",
    districts.map(
      (district) =>
        `${district.provinceId}:${district.slug}`
    )
  );

  for (const district of districts) {
    if (!district.id.trim()) {
      errors.push(
        "District found with empty ID."
      );
    }

    if (!district.name.trim()) {
      errors.push(
        `District "${district.id}" has an empty name.`
      );
    }

    if (!district.slug.trim()) {
      errors.push(
        `District "${district.id}" has an empty slug.`
      );
    }

    if (!provinceIds.has(district.provinceId)) {
      errors.push(
        `District "${district.id}" references unknown province "${district.provinceId}".`
      );
    }

    if (
      district.type !== undefined &&
      district.type !== "DISTRICT" &&
      district.type !== "MUNICIPAL_DISTRICT"
    ) {
      errors.push(
        `District "${district.id}" has invalid type "${district.type}".`
      );
    }

    if (
      district.provinceId === "prov_11" &&
      district.type !== "MUNICIPAL_DISTRICT"
    ) {
      errors.push(
        `Maputo City unit "${district.id}" must have type "MUNICIPAL_DISTRICT".`
      );
    }

    if (
      district.provinceId !== "prov_11" &&
      district.type === "MUNICIPAL_DISTRICT"
    ) {
      errors.push(
        `District "${district.id}" is outside Maputo City but is marked as MUNICIPAL_DISTRICT.`
      );
    }
  }

  console.log(
    `   ✅ ${districts.length} district(s) checked.`
  );
}

function validateDistrictCounts(
  districts: District[],
  provinces: Province[]
) {
  console.log(
    "🔎 Validating district counts by province..."
  );

  const counts = new Map<string, number>();

  for (const district of districts) {
    counts.set(
      district.provinceId,
      (counts.get(district.provinceId) ?? 0) + 1
    );
  }

  for (const province of provinces) {
    const actual =
      counts.get(province.id) ?? 0;

    const expected =
      expectedDistrictCounts[province.id];

    if (expected === undefined) {
      warnings.push(
        `No expected district count configured for "${province.name}".`
      );

      continue;
    }

    if (actual !== expected) {
      errors.push(
        `${province.name}: expected ${expected} districts, found ${actual}.`
      );
    }

    console.log(
      `   ${actual === expected ? "✅" : "❌"} ` +
      `${province.name}: ${actual}/${expected}`
    );
  }
}

function validateSources(
  sources: Source[]
) {
  console.log("🔎 Validating sources...");

  reportDuplicateValues(
    "Source ID",
    sources.map((source) => source.id)
  );

  for (const source of sources) {
    if (!source.id.trim()) {
      errors.push(
        "Source found with empty ID."
      );
    }

    if (!source.institution.trim()) {
      errors.push(
        `Source "${source.id}" has an empty institution.`
      );
    }

    if (!source.title.trim()) {
      errors.push(
        `Source "${source.id}" has an empty title.`
      );
    }

    if (
      source.type !== "OFFICIAL" &&
      source.type !== "SECONDARY"
    ) {
      errors.push(
        `Source "${source.id}" has invalid type "${source.type}".`
      );
    }
  }

  console.log(
    `   ✅ ${sources.length} source(s) checked.`
  );
}

function validateDistrictSources(
  districtSources: DistrictSource[],
  districts: District[],
  sources: Source[]
) {
  console.log(
    "🔎 Validating district source references..."
  );

  const districtIds = new Set(
    districts.map((district) => district.id)
  );

  const sourceIds = new Set(
    sources.map((source) => source.id)
  );

  const referencePairs =
    districtSources.map(
      (reference) =>
        `${reference.districtId}:${reference.sourceId}`
    );

  reportDuplicateValues(
    "District/source reference",
    referencePairs
  );

  for (const reference of districtSources) {
    if (!districtIds.has(reference.districtId)) {
      errors.push(
        `District source references unknown district "${reference.districtId}".`
      );
    }

    if (!sourceIds.has(reference.sourceId)) {
      errors.push(
        `District source references unknown source "${reference.sourceId}".`
      );
    }
  }

  /*
   * Every current district must have at least one source.
   * We intentionally do NOT require exactly one source,
   * because a district may later have multiple references.
   */
  const sourcedDistricts = new Set(
    districtSources.map(
      (reference) => reference.districtId
    )
  );

  for (const district of districts) {
    if (!sourcedDistricts.has(district.id)) {
      errors.push(
        `District "${district.id}" has no source reference.`
      );
    }
  }

  console.log(
    `   ✅ ${districtSources.length} reference(s) checked.`
  );
}

async function main() {
  console.log(
    "\n🇲🇿 moz-address-api — Data validation\n"
  );

  try {
    const [
      provinces,
      districts,
      sources,
      districtSources
    ] = await Promise.all([
      readJson<Province[]>(paths.provinces),
      readJson<District[]>(paths.districts),
      readJson<Source[]>(paths.sources),
      readJson<DistrictSource[]>(
        paths.districtSources
      )
    ]);

    validateProvinceData(provinces);

    validateDistrictData(
      districts,
      provinces
    );

    validateDistrictCounts(
      districts,
      provinces
    );

    validateSources(sources);

    validateDistrictSources(
      districtSources,
      districts,
      sources
    );

    console.log("\n📊 Dataset summary");
    console.log(
      `   Provinces: ${provinces.length}`
    );
    console.log(
      `   Districts: ${districts.length}`
    );
    console.log(
      `   Sources: ${sources.length}`
    );
    console.log(
      `   District source references: ${districtSources.length}`
    );

    if (warnings.length > 0) {
      console.log("\n⚠️ Warnings");

      for (const warning of warnings) {
        console.log(`   - ${warning}`);
      }
    }

    if (errors.length > 0) {
      console.error(
        `\n❌ Validation failed with ${errors.length} error(s):\n`
      );

      for (const error of errors) {
        console.error(`   - ${error}`);
      }

      process.exitCode = 1;

      return;
    }

    console.log(
      "\n✅ Dataset validation passed successfully.\n"
    );
  } catch (error) {
    console.error(
      "\n❌ Unable to validate dataset."
    );

    console.error(error);

    process.exitCode = 1;
  }
}

await main();
