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

async function readJsonOrEmpty<T>(
  filePath: string
): Promise<T[]> {
  try {
    return JSON.parse(
      await readFile(
        filePath,
        "utf8"
      )
    ) as T[];
  } catch (
    error
  ) {
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

function mergeById<T extends { id: string }>(
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

  for (
    const item of
    incoming
  ) {
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
) {
  const map =
    new Map<string, LocalitySourceRecord>();

  for (
    const item of
    [
      ...current,
      ...incoming
    ]
  ) {
    const key =
      `${item.localityId}|${item.sourceId}`;

    map.set(
      key,
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

const MANHICA_SOURCE_ID =
  "gov-maputo-manhica-district-profile";

const MOZGIS_SOURCE_ID =
  "ine-mozgis-localities-2017";

const CURRENT_COUNT_SOURCE_ID =
  "ine-maputo-province-yearbook-2024";

const manhicaLocalities: LocalityRecord[] = [
  locality(
    "adm_post_maputo_manhica_manhica_sede",
    "Manhiça"
  ),
  locality(
    "adm_post_maputo_manhica_manhica_sede",
    "Maciana"
  ),

  locality(
    "adm_post_maputo_manhica_xinavane",
    "Xinavane"
  ),
  locality(
    "adm_post_maputo_manhica_xinavane",
    "25 de Setembro"
  ),

  locality(
    "adm_post_maputo_manhica_3_de_fevereiro",
    "3 de Fevereiro"
  ),
  locality(
    "adm_post_maputo_manhica_3_de_fevereiro",
    "Nwamatizyane"
  ),
  locality(
    "adm_post_maputo_manhica_3_de_fevereiro",
    "Taninja"
  ),

  locality(
    "adm_post_maputo_manhica_calanga",
    "Checua"
  ),
  locality(
    "adm_post_maputo_manhica_calanga",
    "Lago Pate"
  ),

  locality(
    "adm_post_maputo_manhica_maluana",
    "Maluana"
  ),
  locality(
    "adm_post_maputo_manhica_maluana",
    "Munguine"
  ),

  locality(
    "adm_post_maputo_manhica_ilha_josina_machel",
    "Maguiguana"
  ),
  locality(
    "adm_post_maputo_manhica_ilha_josina_machel",
    "Nzonguene"
  )
];

const matutuineLocalities: LocalityRecord[] = [
  locality(
    "adm_post_maputo_matutuine_bela_vista",
    "Vila de Bela Vista"
  ),
  locality(
    "adm_post_maputo_matutuine_bela_vista",
    "Missevene"
  ),
  locality(
    "adm_post_maputo_matutuine_bela_vista",
    "Salamanga"
  ),
  locality(
    "adm_post_maputo_matutuine_bela_vista",
    "Tinonganine"
  ),
  locality(
    "adm_post_maputo_matutuine_bela_vista",
    "Madjuva"
  ),

  locality(
    "adm_post_maputo_matutuine_catembe",
    "M'Sime"
  ),
  locality(
    "adm_post_maputo_matutuine_catembe",
    "Mungazine"
  ),

  locality(
    "adm_post_maputo_matutuine_catuane",
    "Pazimane"
  ),
  locality(
    "adm_post_maputo_matutuine_catuane",
    "Manhangane"
  ),

  locality(
    "adm_post_maputo_matutuine_machangulo",
    "Ndelane"
  ),
  locality(
    "adm_post_maputo_matutuine_machangulo",
    "Nhunguane"
  ),

  locality(
    "adm_post_maputo_matutuine_zitundo",
    "Zitundo-Sede"
  ),
  locality(
    "adm_post_maputo_matutuine_zitundo",
    "Manhoca"
  ),
  locality(
    "adm_post_maputo_matutuine_zitundo",
    "Ponta de Ouro"
  )
];

async function main() {
  const root =
    process.cwd();

  if (
    manhicaLocalities.length !==
    13
  ) {
    throw new Error(
      "Manhiça locality set must contain exactly 13 records."
    );
  }

  if (
    matutuineLocalities.length !==
    14
  ) {
    throw new Error(
      "Matutuíne locality set must contain exactly 14 records."
    );
  }

  const allLocalities = [
    ...manhicaLocalities,
    ...matutuineLocalities
  ];

  const idSet =
    new Set(
      allLocalities.map(
        (item) =>
          item.id
      )
    );

  if (
    idSet.size !==
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
      {
        recursive: true
      }
    ),
    mkdir(
      sourceDir,
      {
        recursive: true
      }
    ),
    mkdir(
      refDir,
      {
        recursive: true
      }
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

  const sources: SourceRecord[] = [
    {
      id:
        MANHICA_SOURCE_ID,

      institution:
        "Ministério da Administração Estatal / Governo da Província de Maputo",

      title:
        "Perfil do Distrito da Manhiça",

      type:
        "OFFICIAL",

      year:
        2005,

      url:
        "https://pmaputo.gov.mz/por/content/download/6179/44263/version/2/file/Perfil_Manhica.pdf",

      accessedAt,

      notes:
        "Official district profile explicitly distinguishes 2 vilas from 13 localidades and enumerates the 13 locality names by administrative post. The current INE Maputo Province total remains 13 localities."
    },
    {
      id:
        MOZGIS_SOURCE_ID,

      institution:
        "Instituto Nacional de Estatística / MozGIS",

      title:
        "SociedPopulacaoLocalidadeBairro2017",

      type:
        "OFFICIAL",

      year:
        2017,

      url:
        "https://www.mozgis.gov.mz/server/rest/services/MEF/MEFAAPAnaliseInfraestruturas/MapServer/24",

      accessedAt,

      notes:
        "Official INE/MozGIS layer used for Matutuíne locality names and hierarchy. Catembe M'Sime is reconciled to the canonical Catembe administrative post."
    }
  ];

  const refs: LocalitySourceRecord[] = [
    ...manhicaLocalities.flatMap(
      (item) => [
        {
          localityId:
            item.id,
          sourceId:
            MANHICA_SOURCE_ID,
          page:
            "12",
          notes:
            "Locality explicitly enumerated by administrative post in the official district profile."
        },
        {
          localityId:
            item.id,
          sourceId:
            CURRENT_COUNT_SOURCE_ID,
          page:
            "14",
          notes:
            "Current district locality total corroborated by the INE Maputo Province 2024 statistical yearbook."
        }
      ]
    ),

    ...matutuineLocalities.flatMap(
      (item) => [
        {
          localityId:
            item.id,
          sourceId:
            MOZGIS_SOURCE_ID,
          page:
            null,
          notes:
            "Locality name and administrative-post hierarchy taken from the official INE/MozGIS 2017 layer."
        },
        {
          localityId:
            item.id,
          sourceId:
            CURRENT_COUNT_SOURCE_ID,
          page:
            "14",
          notes:
            "Current district locality total corroborated by the INE Maputo Province 2024 statistical yearbook."
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

  const completed =
    new Set([
      "dist_maputo_manhica",
      "dist_maputo_matutuine"
    ]);

  coverage.districts =
    coverage.districts.map(
      (district) =>
        completed.has(
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
          "Second batch:"
        )
    ),
    "Second batch: Manhiça (13) and Matutuíne (14) promoted. Manhiça uses the official district profile's explicit 13-locality list; Matutuíne uses the 14-record MozGIS/INE set with Catembe M'Sime reconciled to the canonical Catembe administrative post and the current INE count target."
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
    "✅ Second Maputo batch promoted."
  );

  console.log(
    "   ✅ Manhiça: 13/13"
  );

  console.log(
    "   ✅ Matutuíne: 14/14"
  );

  console.log(
    "   Total added/merged: 27 localities"
  );

  console.log(
    "\nRemaining reconciliation:"
  );

  console.log(
    "   ⚠️ Boane: 3"
  );

  console.log(
    "   ⚠️ Magude: 17"
  );
}

await main();
