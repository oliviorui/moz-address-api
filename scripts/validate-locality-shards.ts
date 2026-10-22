import {
  readdir,
  readFile
} from "node:fs/promises";

import path from "node:path";

import {
  fileURLToPath
} from "node:url";

type District = {
  id: string;
  name: string;
  type?:
    | "DISTRICT"
    | "MUNICIPAL_DISTRICT";
};

type AdministrativePost = {
  id: string;
  name: string;
  districtId: string;
};

type Locality = {
  id: string;
  code: string | null;
  name: string;
  slug: string;
  type:
    | "LOCALITY"
    | "NEIGHBORHOOD";
  administrativePostId:
    | string
    | null;
  districtId:
    | string
    | null;
};

type Source = {
  id: string;
};

type LocalitySource = {
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

const errors: string[] = [];

async function readJson<T>(
  filePath: string
): Promise<T> {
  const content =
    await readFile(
      filePath,
      "utf8"
    );

  return JSON.parse(content) as T;
}

async function readJsonArrays<T>(
  directory: string
): Promise<T[]> {
  let entries;

  try {
    entries =
      await readdir(
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

  const records: T[] = [];

  for (
    const entry of
    entries
      .filter(
        (item) =>
          item.isFile() &&
          item.name.endsWith(
            ".json"
          )
      )
      .sort(
        (a, b) =>
          a.name.localeCompare(
            b.name
          )
      )
  ) {
    const content =
      await readFile(
        path.join(
          directory,
          entry.name
        ),
        "utf8"
      );

    records.push(
      ...(
        JSON.parse(
          content
        ) as T[]
      )
    );
  }

  return records;
}

function duplicateValues(
  values: string[]
) {
  const seen =
    new Set<string>();

  const duplicates =
    new Set<string>();

  for (const value of values) {
    if (seen.has(value)) {
      duplicates.add(value);
    }

    seen.add(value);
  }

  return [...duplicates];
}

async function main() {
  console.log(
    "🔎 Validating locality data shards..."
  );

  const baseLocalities =
    await readJson<Locality[]>(
      path.join(
        rootDir,
        "data",
        "current",
        "localities.json"
      )
    );

  const shardLocalities =
    await readJsonArrays<Locality>(
      path.join(
        rootDir,
        "data",
        "current",
        "localities-by-area"
      )
    );

  const administrativePosts =
    await readJson<
      AdministrativePost[]
    >(
      path.join(
        rootDir,
        "data",
        "current",
        "administrative-posts.json"
      )
    );

  const districts =
    await readJson<District[]>(
      path.join(
        rootDir,
        "data",
        "current",
        "districts.json"
      )
    );

  const baseSources =
    await readJson<Source[]>(
      path.join(
        rootDir,
        "data",
        "sources",
        "sources.json"
      )
    );

  const shardSources =
    await readJsonArrays<Source>(
      path.join(
        rootDir,
        "data",
        "sources",
        "sources-by-area"
      )
    );

  const localitySources =
    await readJsonArrays<LocalitySource>(
      path.join(
        rootDir,
        "data",
        "sources",
        "locality-sources-by-area"
      )
    );

  const allLocalityIds =
    [
      ...baseLocalities,
      ...shardLocalities
    ].map(
      (item) => item.id
    );

  for (
    const duplicate of
    duplicateValues(
      allLocalityIds
    )
  ) {
    errors.push(
      `Locality ID duplicated across base/shards: "${duplicate}".`
    );
  }

  const postIds =
    new Set(
      administrativePosts.map(
        (post) => post.id
      )
    );

  const districtMap =
    new Map(
      districts.map(
        (district) => [
          district.id,
          district
        ]
      )
    );

  for (
    const locality of
    shardLocalities
  ) {
    if (
      !locality.id.trim() ||
      !locality.name.trim() ||
      !locality.slug.trim()
    ) {
      errors.push(
        `Invalid empty field in shard locality "${locality.id}".`
      );
    }

    const hasPost =
      locality
        .administrativePostId !==
      null;

    const hasDistrict =
      locality.districtId !==
      null;

    if (
      hasPost === hasDistrict
    ) {
      errors.push(
        `Shard locality "${locality.id}" must reference exactly one parent.`
      );

      continue;
    }

    if (hasPost) {
      if (
        !postIds.has(
          locality
            .administrativePostId!
        )
      ) {
        errors.push(
          `Shard locality "${locality.id}" references unknown administrative post "${locality.administrativePostId}".`
        );
      }
    }

    if (hasDistrict) {
      const district =
        districtMap.get(
          locality.districtId!
        );

      if (!district) {
        errors.push(
          `Shard locality "${locality.id}" references unknown district "${locality.districtId}".`
        );
      } else if (
        locality.type ===
          "NEIGHBORHOOD" &&
        district.type !==
          "MUNICIPAL_DISTRICT"
      ) {
        errors.push(
          `Direct district neighborhood "${locality.id}" must belong to a MUNICIPAL_DISTRICT.`
        );
      }
    }

    if (
      locality.type ===
        "LOCALITY" &&
      !hasPost
    ) {
      errors.push(
        `LOCALITY "${locality.id}" must reference an administrative post.`
      );
    }
  }

  const allSourceIds =
    new Set(
      [
        ...baseSources,
        ...shardSources
      ].map(
        (source) => source.id
      )
    );

  const shardLocalityIds =
    new Set(
      shardLocalities.map(
        (item) => item.id
      )
    );

  const sourcedLocalityIds =
    new Set<string>();

  for (
    const reference of
    localitySources
  ) {
    if (
      !shardLocalityIds.has(
        reference.localityId
      )
    ) {
      errors.push(
        `Shard source reference points to unknown shard locality "${reference.localityId}".`
      );
    }

    if (
      !allSourceIds.has(
        reference.sourceId
      )
    ) {
      errors.push(
        `Shard source reference uses unknown source "${reference.sourceId}".`
      );
    }

    sourcedLocalityIds.add(
      reference.localityId
    );
  }

  for (
    const locality of
    shardLocalities
  ) {
    if (
      !sourcedLocalityIds.has(
        locality.id
      )
    ) {
      errors.push(
        `Shard locality "${locality.id}" has no source reference.`
      );
    }
  }

  const expectedMatolaCounts =
    new Map<string, number>([
      [
        "adm_post_maputo_matola_infulene",
        15
      ],
      [
        "adm_post_maputo_matola_machava",
        14
      ],
      [
        "adm_post_maputo_matola_cidade_da_matola",
        13
      ]
    ]);

  let matolaTotal = 0;

  for (
    const [
      administrativePostId,
      expected
    ] of expectedMatolaCounts
  ) {
    const actual =
      shardLocalities.filter(
        (locality) =>
          locality.type ===
            "NEIGHBORHOOD" &&
          locality
            .administrativePostId ===
            administrativePostId
      ).length;

    matolaTotal += actual;

    if (actual !== expected) {
      errors.push(
        `Matola administrative post "${administrativePostId}" expected ${expected} neighborhoods, found ${actual}.`
      );
    } else {
      console.log(
        `   ✅ ${administrativePostId}: ${actual}/${expected}`
      );
    }
  }

  if (matolaTotal !== 42) {
    errors.push(
      `Matola expected 42 neighborhoods, found ${matolaTotal}.`
    );
  }

  const intaca =
    shardLocalities.find(
      (locality) =>
        locality.slug ===
          "intaca" &&
        locality
          .administrativePostId ===
          "adm_post_maputo_matola_infulene"
    );

  if (!intaca) {
    errors.push(
      "Matola shard must contain Intaca under Infulene."
    );
  }

  if (errors.length > 0) {
    console.error(
      "\n❌ Locality shard validation failed:\n"
    );

    for (const error of errors) {
      console.error(
        ` - ${error}`
      );
    }

    process.exitCode = 1;
    return;
  }

  console.log(
    `✅ ${shardLocalities.length} shard locality/neighborhood record(s) checked.`
  );

  console.log(
    "✅ Matola municipal coverage: 42/42 neighborhoods."
  );
}

await main();
