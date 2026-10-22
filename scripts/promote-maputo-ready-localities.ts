import {
  mkdir,
  readFile,
  writeFile
} from "node:fs/promises";

import path from "node:path";

type Candidate = {
  id: string;
  code: null;
  name: string;
  slug: string;
  type: "LOCALITY";
  administrativePostId: string;
  districtId: null;
};

type ReportDistrict = {
  districtId: string;
  district: string;
  expectedLocalities: number;
  sourceLocalities: number;
  exactCountMatch: boolean;
  allPostsMapped: boolean;
  candidateCount: number;
  promotionReadiness:
    | "READY_FOR_REVIEW"
    | "NEEDS_RECONCILIATION";
  candidates: Candidate[];
};

type ReconciliationReport = {
  districts: ReportDistrict[];
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

const APPROVED_DISTRICT_IDS =
  new Set([
    "dist_maputo_marracuene",
    "dist_maputo_moamba",
    "dist_maputo_namaacha"
  ]);

const MOZGIS_SOURCE_ID =
  "ine-mozgis-localities-2017";

const CURRENT_COUNT_SOURCE_ID =
  "ine-maputo-province-yearbook-2024";

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

function canonicalId(
  candidate: Candidate
) {
  const postPart =
    candidate.administrativePostId
      .replace(
        /^adm_post_/,
        ""
      );

  return `locality_${postPart}_${candidate.slug.replace(/-/g, "_")}`;
}

async function main() {
  const root =
    process.cwd();

  const reportPath =
    path.join(
      root,
      "data",
      "research",
      "reconciliation",
      "maputo-mozgis-2017-comparison.json"
    );

  const coveragePath =
    path.join(
      root,
      "data",
      "coverage",
      "maputo-province.json"
    );

  const report =
    await readJson<
      ReconciliationReport
    >(
      reportPath
    );

  const coverage =
    await readJson<Coverage>(
      coveragePath
    );

  const selected =
    report.districts.filter(
      (district) =>
        APPROVED_DISTRICT_IDS.has(
          district.districtId
        )
    );

  if (
    selected.length !==
    APPROVED_DISTRICT_IDS.size
  ) {
    throw new Error(
      "Expected Marracuene, Moamba and Namaacha in the reconciliation report."
    );
  }

  for (const district of selected) {
    if (
      district.promotionReadiness !==
        "READY_FOR_REVIEW" ||
      !district.exactCountMatch ||
      !district.allPostsMapped ||
      district.candidateCount !==
        district.expectedLocalities
    ) {
      throw new Error(
        `${district.district} is no longer safe for batch promotion. Re-run reconciliation and review the report.`
      );
    }
  }

  const localities =
    selected.flatMap(
      (district) =>
        district.candidates.map(
          (candidate) => ({
            ...candidate,
            id:
              canonicalId(
                candidate
              )
          })
        )
    );

  const uniqueIds =
    new Set(
      localities.map(
        (locality) =>
          locality.id
      )
    );

  if (
    uniqueIds.size !==
    localities.length
  ) {
    throw new Error(
      "Duplicate canonical locality IDs detected. Promotion aborted."
    );
  }

  const sources = [
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

      accessedAt:
        new Date()
          .toISOString()
          .slice(
            0,
            10
          ),

      notes:
        "Official INE/MozGIS locality and bairro layer used for locality names and parent administrative-post hierarchy. Promoted only where the 2017 district locality count exactly matches the newer INE Maputo Province target and all administrative posts map uniquely."
    }
  ];

  const localitySources =
    localities.flatMap(
      (locality) => [
        {
          localityId:
            locality.id,

          sourceId:
            MOZGIS_SOURCE_ID,

          page:
            null,

          notes:
            "Locality name and administrative-post parent taken from the official INE/MozGIS 2017 locality layer."
        },
        {
          localityId:
            locality.id,

          sourceId:
            CURRENT_COUNT_SOURCE_ID,

          page:
            "14",

          notes:
            "Current district locality total corroborated by the INE Maputo Province 2024 statistical yearbook. This reference supports count continuity, while locality names/hierarchy come from MozGIS 2017."
        }
      ]
    );

  const completedIds =
    new Set(
      selected.map(
        (district) =>
          district.districtId
      )
    );

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
          "Batch promotion:"
        )
    ),
    "Batch promotion: Marracuene, Moamba and Namaacha were promoted after exact locality-count agreement between MozGIS/INE 2017 and the current INE Maputo Province target, with unique administrative-post mappings."
  ];

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

  await writeFile(
    path.join(
      currentDir,
      "maputo-reconciled.json"
    ),
    JSON.stringify(
      localities,
      null,
      2
    ) + "\n",
    "utf8"
  );

  await writeFile(
    path.join(
      sourceDir,
      "maputo-reconciled.json"
    ),
    JSON.stringify(
      sources,
      null,
      2
    ) + "\n",
    "utf8"
  );

  await writeFile(
    path.join(
      refDir,
      "maputo-reconciled.json"
    ),
    JSON.stringify(
      localitySources,
      null,
      2
    ) + "\n",
    "utf8"
  );

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
    "✅ Batch promotion completed."
  );

  for (const district of selected) {
    console.log(
      `   ✅ ${district.district}: ${district.candidateCount}/${district.expectedLocalities}`
    );
  }

  console.log(
    `\n   Total promoted localities: ${localities.length}`
  );

  console.log(
    "   Coverage statuses updated to COMPLETE for Marracuene, Moamba and Namaacha."
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
    "   npm run test:integration"
  );
}

await main();
