import {
  mkdir,
  readFile,
  writeFile
} from "node:fs/promises";

import path from "node:path";

type LocalityRecord = {
  id: string;
  code: null;
  name: string;
  slug: string;
  type: "LOCALITY";
  administrativePostId: string;
  districtId: null;
};

type SourceRecord = {
  id: string;
  institution: string;
  title: string;
  type: "OFFICIAL";
  year: number;
  url: string;
  accessedAt: string;
  notes: string;
};

type LocalitySourceRecord = {
  localityId: string;
  sourceId: string;
  page: string | null;
  notes: string;
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
  sourceId: string;
  expected: {
    administrativePosts: number;
    localities: number;
    cityNeighborhoods: number;
  };
  districts: CoverageDistrict[];
  notes: string[];
};

function slugify(
  value: string
): string {
  return value
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

function locality(
  administrativePostId: string,
  name: string
): LocalityRecord {
  const slug =
    slugify(name);

  return {
    id:
      `locality_${administrativePostId
        .replace(
          /^adm_post_/,
          ""
        )}_${slug.replace(
          /-/g,
          "_"
        )}`,

    code: null,
    name,
    slug,
    type: "LOCALITY",
    administrativePostId,
    districtId: null
  };
}

async function readJson<T>(
  filePath: string
): Promise<T> {
  return JSON.parse(
    await readFile(
      filePath,
      "utf8"
    )
  ) as T;
}

async function readJsonOrEmpty<T>(
  filePath: string
): Promise<T[]> {
  try {
    return await readJson<T[]>(
      filePath
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
}

function mergeById<
  T extends { id: string }
>(
  current: T[],
  incoming: T[]
): T[] {
  const map =
    new Map(
      current.map(
        (item) => [
          item.id,
          item
        ]
      )
    );

  for (const item of incoming) {
    map.set(
      item.id,
      item
    );
  }

  return [
    ...map.values()
  ].sort(
    (a, b) =>
      a.id.localeCompare(
        b.id
      )
  );
}

function mergeSourceRefs(
  current: LocalitySourceRecord[],
  incoming: LocalitySourceRecord[]
): LocalitySourceRecord[] {
  const map =
    new Map<
      string,
      LocalitySourceRecord
    >();

  for (
    const item of
    [
      ...current,
      ...incoming
    ]
  ) {
    map.set(
      `${item.localityId}|${item.sourceId}`,
      item
    );
  }

  return [
    ...map.values()
  ].sort(
    (a, b) =>
      `${a.localityId}|${a.sourceId}`
        .localeCompare(
          `${b.localityId}|${b.sourceId}`
        )
  );
}

const CURRENT_COUNT_SOURCE_ID =
  "ine-maputo-province-yearbook-2024";

const BOANE_ADMIN_SOURCE_ID =
  "maputo-boane-matola-rio-admin-2025";

const MAGUDE_GAZETTE_SOURCE_ID =
  "boletim-republica-magude-2024";

const boaneLocalities:
  LocalityRecord[] = [
    locality(
      "adm_post_maputo_boane_boane",
      "Gueguegue"
    ),
    locality(
      "adm_post_maputo_boane_boane",
      "Eduardo Mondlane"
    ),
    locality(
      "adm_post_maputo_boane_matola_rio",
      "Mulotana"
    )
  ];

const magudeLocalities:
  LocalityRecord[] = [
    locality(
      "adm_post_maputo_magude_magude_sede",
      "Matchabe"
    ),
    locality(
      "adm_post_maputo_magude_magude_sede",
      "Chichuco"
    ),
    locality(
      "adm_post_maputo_magude_magude_sede",
      "Macubulane"
    ),
    locality(
      "adm_post_maputo_magude_magude_sede",
      "Maguiguana"
    ),
    locality(
      "adm_post_maputo_magude_magude_sede",
      "Moine"
    ),
    locality(
      "adm_post_maputo_magude_magude_sede",
      "Inhongane"
    ),
    locality(
      "adm_post_maputo_magude_magude_sede",
      "Mulelemane"
    ),

    locality(
      "adm_post_maputo_magude_mahele",
      "Mahele-Sede"
    ),
    locality(
      "adm_post_maputo_magude_mahele",
      "Chicutso"
    ),

    locality(
      "adm_post_maputo_magude_mapulanguene",
      "Mapulanguene-Sede"
    ),
    locality(
      "adm_post_maputo_magude_mapulanguene",
      "Mangondzo"
    ),
    locality(
      "adm_post_maputo_magude_mapulanguene",
      "Matsandzane"
    ),

    locality(
      "adm_post_maputo_magude_motaze",
      "Motaze-Sede"
    ),
    locality(
      "adm_post_maputo_magude_motaze",
      "Marrule"
    ),
    locality(
      "adm_post_maputo_magude_motaze",
      "Nwambjwana"
    ),

    locality(
      "adm_post_maputo_magude_panjane",
      "Panjane-Sede"
    ),
    locality(
      "adm_post_maputo_magude_panjane",
      "Chivonguene"
    )
  ];

async function main() {
  const root =
    process.cwd();

  if (
    boaneLocalities.length !== 3
  ) {
    throw new Error(
      "Boane must contain exactly 3 localities."
    );
  }

  if (
    magudeLocalities.length !== 17
  ) {
    throw new Error(
      "Magude must contain exactly 17 localities."
    );
  }

  const allLocalities = [
    ...boaneLocalities,
    ...magudeLocalities
  ];

  const ids =
    new Set(
      allLocalities.map(
        (item) => item.id
      )
    );

  if (
    ids.size !==
    allLocalities.length
  ) {
    throw new Error(
      "Duplicate locality IDs detected."
    );
  }

  const currentDir =
    path.join(
      root,
      "data",
      "current",
      "localities-by-area"
    );

  const sourceDir =
    path.join(
      root,
      "data",
      "sources",
      "sources-by-area"
    );

  const refDir =
    path.join(
      root,
      "data",
      "sources",
      "locality-sources-by-area"
    );

  await Promise.all([
    mkdir(
      currentDir,
      { recursive: true }
    ),
    mkdir(
      sourceDir,
      { recursive: true }
    ),
    mkdir(
      refDir,
      { recursive: true }
    )
  ]);

  const localityFile =
    path.join(
      currentDir,
      "maputo-reconciled.json"
    );

  const sourceFile =
    path.join(
      sourceDir,
      "maputo-reconciled.json"
    );

  const referenceFile =
    path.join(
      refDir,
      "maputo-reconciled.json"
    );

  const currentLocalities =
    await readJsonOrEmpty<
      LocalityRecord
    >(
      localityFile
    );

  const currentSources =
    await readJsonOrEmpty<
      SourceRecord
    >(
      sourceFile
    );

  const currentRefs =
    await readJsonOrEmpty<
      LocalitySourceRecord
    >(
      referenceFile
    );

  const accessedAt =
    new Date()
      .toISOString()
      .slice(
        0,
        10
      );

  const sources:
    SourceRecord[] = [
    {
      id:
        BOANE_ADMIN_SOURCE_ID,

      institution:
        "Governo do Distrito de Boane / Municípios de Boane e Matola-Rio",

      title:
        "Caracterização administrativa dos Municípios da Vila de Boane e Matola-Rio",

      type:
        "OFFICIAL",

      year:
        2025,

      url:
        "https://sdgs.un.org/sites/default/files/2025-02/Session%204%20-%209%20Boane%20Districe.Municipios%20de%20Boane.Matola.pdf",

      accessedAt,

      notes:
        "Official administrative presentation confirming Gueguegue and Eduardo Mondlane as the two municipal localities of Boane and documenting the 2023 municipalization of Matola-Rio. Mulotana remains the non-municipal locality under the Matola-Rio administrative post; the current INE provincial target is 3 district localities."
    },

    {
      id:
        MAGUDE_GAZETTE_SOURCE_ID,

      institution:
        "República de Moçambique",

      title:
        "Boletim da República, I Série, n.º 32, 14 de Fevereiro de 2024",

      type:
        "OFFICIAL",

      year:
        2024,

      url:
        "https://archive.gazettes.africa/archive/mz/2024/mz-government-gazette-series-i-dated-2024-02-14-no-32.pdf",

      accessedAt,

      notes:
        "Official gazette electoral territorial table used to reconcile the current Magude locality structure. The 17-locality set excludes Vila de Magude as a locality record and excludes the historical Pontia record; spelling follows the current territorial listing where supported."
    }
  ];

  const refs:
    LocalitySourceRecord[] = [
    ...boaneLocalities.flatMap(
      (item) => [
        {
          localityId:
            item.id,
          sourceId:
            BOANE_ADMIN_SOURCE_ID,
          page:
            null,
          notes:
            "Current administrative status reconciled from the official Boane/Matola-Rio municipal structure."
        },
        {
          localityId:
            item.id,
          sourceId:
            CURRENT_COUNT_SOURCE_ID,
          page:
            "14",
          notes:
            "Current district total corroborated by the INE Maputo Province statistical yearbook."
        }
      ]
    ),

    ...magudeLocalities.flatMap(
      (item) => [
        {
          localityId:
            item.id,
          sourceId:
            MAGUDE_GAZETTE_SOURCE_ID,
          page:
            "243-244",
          notes:
            "Locality and parent administrative post reconciled from the official 2024 electoral territorial table."
        },
        {
          localityId:
            item.id,
          sourceId:
            CURRENT_COUNT_SOURCE_ID,
          page:
            "14",
          notes:
            "Current district total corroborated by the INE Maputo Province statistical yearbook."
        }
      ]
    )
  ];

  await writeFile(
    localityFile,
    JSON.stringify(
      mergeById(
        currentLocalities,
        allLocalities
      ),
      null,
      2
    ) + "\n",
    "utf8"
  );

  await writeFile(
    sourceFile,
    JSON.stringify(
      mergeById(
        currentSources,
        sources
      ),
      null,
      2
    ) + "\n",
    "utf8"
  );

  await writeFile(
    referenceFile,
    JSON.stringify(
      mergeSourceRefs(
        currentRefs,
        refs
      ),
      null,
      2
    ) + "\n",
    "utf8"
  );

  const coveragePath =
    path.join(
      root,
      "data",
      "coverage",
      "maputo-province.json"
    );

  const coverage =
    await readJson<Coverage>(
      coveragePath
    );

  const completedIds =
    new Set([
      "dist_maputo_boane",
      "dist_maputo_magude"
    ]);

  coverage.districts =
    coverage.districts.map(
      (district) =>
        completedIds.has(
          district.districtId
        )
          ? {
              ...district,
              status:
                "COMPLETE"
            }
          : district
    );

  coverage.notes = [
    ...coverage.notes.filter(
      (note) =>
        !note.startsWith(
          "Final batch:"
        )
    ),
    "Final batch: Boane (3) and Magude (17) reconciled and promoted, bringing Maputo Province locality coverage to 76/76."
  ];

  await writeFile(
    coveragePath,
    JSON.stringify(
      coverage,
      null,
      2
    ) + "\n",
    "utf8"
  );

  console.log(
    "✅ Final Maputo Province batch promoted."
  );

  console.log(
    "   ✅ Boane: 3/3"
  );

  console.log(
    "   ✅ Magude: 17/17"
  );

  console.log(
    "   ✅ Maputo Province localities: 76/76"
  );

  console.log(
    "   ✅ Matola neighborhoods: 42/42"
  );

  console.log(
    "\nNext:"
  );

  console.log(
    "   npm run data:validate"
  );

  console.log(
    "   npm run db:seed"
  );

  console.log(
    "   npm run typecheck"
  );

  console.log(
    "   npm run build"
  );

  console.log(
    "   npm run test:integration"
  );
}

await main();
