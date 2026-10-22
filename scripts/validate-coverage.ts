import {
  readdir,
  readFile
} from "node:fs/promises";

import path from "node:path";

import {
  fileURLToPath
} from "node:url";

type AdministrativePost = {
  id: string;
  districtId: string;
};

type Locality = {
  id: string;
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

type CoverageDistrict = {
  districtId: string;
  district: string;
  administrativePosts: number;
  localitiesExpected: number;
  neighborhoodsExpected: number;
  status:
    | "COMPLETE"
    | "PENDING_RECONCILIATION";
};

type Coverage = {
  provinceId: string;
  province: string;

  expected: {
    administrativePosts: number;
    localities: number;
    cityNeighborhoods: number;
  };

  districts: CoverageDistrict[];
};

const __filename =
  fileURLToPath(import.meta.url);

const __dirname =
  path.dirname(__filename);

const rootDir =
  path.resolve(__dirname, "..");

async function readJson<T>(
  filePath: string
): Promise<T> {
  const content =
    await readFile(
      filePath,
      "utf8"
    );

  return JSON.parse(
    content
  ) as T;
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

async function main() {
  console.log(
    "🔎 Validating Maputo Province locality coverage..."
  );

  const coverage =
    await readJson<Coverage>(
      path.join(
        rootDir,
        "data",
        "coverage",
        "maputo-province.json"
      )
    );

  const posts =
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

  const localities = [
    ...baseLocalities,
    ...shardLocalities
  ];

  const errors: string[] = [];

  const expectedPostTotal =
    coverage.districts.reduce(
      (
        total,
        district
      ) =>
        total +
        district.administrativePosts,
      0
    );

  const expectedLocalityTotal =
    coverage.districts.reduce(
      (
        total,
        district
      ) =>
        total +
        district.localitiesExpected,
      0
    );

  const expectedNeighborhoodTotal =
    coverage.districts.reduce(
      (
        total,
        district
      ) =>
        total +
        district.neighborhoodsExpected,
      0
    );

  if (
    expectedPostTotal !==
    coverage.expected
      .administrativePosts
  ) {
    errors.push(
      `Configured administrative-post total is ${expectedPostTotal}, expected ${coverage.expected.administrativePosts}.`
    );
  }

  if (
    expectedLocalityTotal !==
    coverage.expected.localities
  ) {
    errors.push(
      `Configured locality total is ${expectedLocalityTotal}, expected ${coverage.expected.localities}.`
    );
  }

  if (
    expectedNeighborhoodTotal !==
    coverage.expected
      .cityNeighborhoods
  ) {
    errors.push(
      `Configured neighborhood total is ${expectedNeighborhoodTotal}, expected ${coverage.expected.cityNeighborhoods}.`
    );
  }

  const postMap =
    new Map(
      posts.map(
        (post) => [
          post.id,
          post
        ]
      )
    );

  let loadedProvinceLocalities = 0;
  let loadedProvinceNeighborhoods = 0;

  for (
    const district of
    coverage.districts
  ) {
    const districtPostIds =
      new Set(
        posts
          .filter(
            (post) =>
              post.districtId ===
              district.districtId
          )
          .map(
            (post) =>
              post.id
          )
      );

    const actualPostCount =
      districtPostIds.size;

    if (
      actualPostCount !==
      district.administrativePosts
    ) {
      errors.push(
        `${district.district}: expected ${district.administrativePosts} administrative posts, found ${actualPostCount}.`
      );
    }

    const loadedLocalities =
      localities.filter(
        (locality) => {
          if (
            locality.type !==
            "LOCALITY"
          ) {
            return false;
          }

          if (
            locality
              .administrativePostId ===
            null
          ) {
            return false;
          }

          return districtPostIds.has(
            locality
              .administrativePostId
          );
        }
      ).length;

    const loadedNeighborhoods =
      localities.filter(
        (locality) => {
          if (
            locality.type !==
            "NEIGHBORHOOD"
          ) {
            return false;
          }

          if (
            locality.districtId ===
            district.districtId
          ) {
            return true;
          }

          if (
            locality
              .administrativePostId ===
            null
          ) {
            return false;
          }

          const post =
            postMap.get(
              locality
                .administrativePostId
            );

          return (
            post?.districtId ===
            district.districtId
          );
        }
      ).length;

    loadedProvinceLocalities +=
      loadedLocalities;

    loadedProvinceNeighborhoods +=
      loadedNeighborhoods;

    const localityState =
      loadedLocalities ===
        district.localitiesExpected
        ? "✅"
        : "⏳";

    const neighborhoodState =
      loadedNeighborhoods ===
        district.neighborhoodsExpected
        ? "✅"
        : "⏳";

    console.log(
      `   ${district.district}:`
    );

    console.log(
      `      ${localityState} localities ${loadedLocalities}/${district.localitiesExpected}`
    );

    console.log(
      `      ${neighborhoodState} neighborhoods ${loadedNeighborhoods}/${district.neighborhoodsExpected}`
    );

    if (
      district.status ===
        "COMPLETE" &&
      (
        loadedLocalities !==
          district.localitiesExpected ||
        loadedNeighborhoods !==
          district.neighborhoodsExpected
      )
    ) {
      errors.push(
        `${district.district} is marked COMPLETE but loaded counts do not match targets.`
      );
    }
  }

  console.log(
    `\n📊 Maputo Province locality coverage: ${loadedProvinceLocalities}/${coverage.expected.localities}`
  );

  console.log(
    `📊 Matola neighborhood coverage: ${loadedProvinceNeighborhoods}/${coverage.expected.cityNeighborhoods}`
  );

  if (errors.length > 0) {
    console.error(
      "\n❌ Coverage validation failed:\n"
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
    "\n✅ Maputo Province coverage configuration is internally consistent."
  );
}

await main();
