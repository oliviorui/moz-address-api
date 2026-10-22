import {
  mkdir,
  writeFile
} from "node:fs/promises";

import path from "node:path";

const SERVICE_URL =
  "https://www.mozgis.gov.mz/server/rest/services/MEF/MEFAAPAnaliseInfraestruturas/MapServer/24/query";

const PAGE_SIZE = 2000;

type ArcGisAttributes = {
  CodProv?: string | null;
  Provincia?: string | null;
  CodDist?: string | null;
  Distrito?: string | null;
  CodPost?: string | null;
  Posto?: string | null;
  CodLocal?: string | null;
  Localidade?: string | null;
  CodBairro?: string | null;
  Bairro?: string | null;
};

type ArcGisFeature = {
  attributes: ArcGisAttributes;
};

type ArcGisResponse = {
  features?: ArcGisFeature[];
  exceededTransferLimit?: boolean;
  error?: {
    code?: number;
    message?: string;
    details?: string[];
  };
};

type ResearchRecord = {
  provinceCode: string | null;
  province: string;
  districtCode: string | null;
  district: string;
  administrativePostCode: string | null;
  administrativePost: string;
  localityCode: string | null;
  locality: string;
  neighborhoodCode: string | null;
  neighborhood: string | null;
};

function clean(
  value: string | null | undefined
): string | null {
  const result =
    value?.trim();

  return result
    ? result
    : null;
}

function normalizeText(
  value: string
): string {
  return value
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .trim();
}

function slugify(
  value: string
): string {
  return normalizeText(
    value
  )
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

function getProvinceArgument():
  string | null {
  const args =
    process.argv.slice(2);

  const inline =
    args.find(
      (argument) =>
        argument.startsWith(
          "--province="
        )
    );

  if (inline) {
    return (
      inline
        .slice(
          "--province=".length
        )
        .trim() ||
      null
    );
  }

  const index =
    args.indexOf(
      "--province"
    );

  if (
    index >= 0 &&
    args[index + 1]
  ) {
    return (
      args[index + 1]!
        .trim() ||
      null
    );
  }

  return null;
}

async function fetchPage(
  offset: number
): Promise<ArcGisResponse> {
  const params =
    new URLSearchParams({
      where:
        "1=1",

      outFields: [
        "CodProv",
        "Provincia",
        "CodDist",
        "Distrito",
        "CodPost",
        "Posto",
        "CodLocal",
        "Localidade",
        "CodBairro",
        "Bairro"
      ].join(","),

      returnGeometry:
        "false",

      orderByFields:
        "Provincia,Distrito,Posto,Localidade,Bairro",

      resultOffset:
        String(offset),

      resultRecordCount:
        String(PAGE_SIZE),

      f: "json"
    });

  const response =
    await fetch(
      `${SERVICE_URL}?${params.toString()}`,
      {
        headers: {
          accept:
            "application/json"
        }
      }
    );

  if (!response.ok) {
    throw new Error(
      `MozGIS request failed with HTTP ${response.status}.`
    );
  }

  const payload =
    (await response.json()) as
      ArcGisResponse;

  if (payload.error) {
    throw new Error(
      [
        payload.error.message ??
          "ArcGIS error",

        ...(
          payload.error.details ??
          []
        )
      ].join(" | ")
    );
  }

  return payload;
}

async function fetchAllFeatures():
  Promise<ArcGisFeature[]> {
  const features:
    ArcGisFeature[] = [];

  let offset = 0;

  while (true) {
    const page =
      await fetchPage(
        offset
      );

    const pageFeatures =
      page.features ?? [];

    features.push(
      ...pageFeatures
    );

    console.log(
      `   fetched ${features.length} feature(s)...`
    );

    if (
      pageFeatures.length <
        PAGE_SIZE &&
      !page.exceededTransferLimit
    ) {
      break;
    }

    if (
      pageFeatures.length === 0
    ) {
      break;
    }

    offset +=
      pageFeatures.length;
  }

  return features;
}

function normalizeFeatures(
  features: ArcGisFeature[]
): ResearchRecord[] {
  const records:
    ResearchRecord[] = [];

  for (const feature of features) {
    const attributes =
      feature.attributes;

    const province =
      clean(
        attributes.Provincia
      );

    const district =
      clean(
        attributes.Distrito
      );

    const administrativePost =
      clean(
        attributes.Posto
      );

    const locality =
      clean(
        attributes.Localidade
      );

    if (
      !province ||
      !district ||
      !administrativePost ||
      !locality
    ) {
      continue;
    }

    records.push({
      provinceCode:
        clean(
          attributes.CodProv
        ),

      province,

      districtCode:
        clean(
          attributes.CodDist
        ),

      district,

      administrativePostCode:
        clean(
          attributes.CodPost
        ),

      administrativePost,

      localityCode:
        clean(
          attributes.CodLocal
        ),

      locality,

      neighborhoodCode:
        clean(
          attributes.CodBairro
        ),

      neighborhood:
        clean(
          attributes.Bairro
        )
    });
  }

  return records;
}

function deduplicate(
  records: ResearchRecord[]
): ResearchRecord[] {
  const unique =
    new Map<
      string,
      ResearchRecord
    >();

  for (const record of records) {
    const key = [
      record.provinceCode ?? "",
      record.province,
      record.districtCode ?? "",
      record.district,
      record.administrativePostCode ?? "",
      record.administrativePost,
      record.localityCode ?? "",
      record.locality,
      record.neighborhoodCode ?? "",
      record.neighborhood ?? ""
    ].join("|");

    unique.set(
      key,
      record
    );
  }

  return [
    ...unique.values()
  ];
}

function filterProvince(
  records: ResearchRecord[],
  province: string | null
): ResearchRecord[] {
  if (!province) {
    return records;
  }

  const target =
    normalizeText(
      province
    );

  const exact =
    records.filter(
      (record) =>
        normalizeText(
          record.province
        ) === target
    );

  if (exact.length > 0) {
    return exact;
  }

  const partial =
    records.filter(
      (record) =>
        normalizeText(
          record.province
        ).includes(
          target
        )
    );

  if (partial.length > 0) {
    return partial;
  }

  const available =
    [
      ...new Set(
        records.map(
          (record) =>
            record.province
        )
      )
    ].sort();

  throw new Error(
    [
      `Province "${province}" was not found in MozGIS records.`,
      `Available values: ${available.join(", ")}`
    ].join(" ")
  );
}

function buildSummary(
  records: ResearchRecord[]
) {
  const provinceNames =
    new Set(
      records.map(
        (record) =>
          record.province
      )
    );

  const districtKeys =
    new Set(
      records.map(
        (record) =>
          [
            record.province,
            record.district
          ].join("|")
      )
    );

  const postKeys =
    new Set(
      records.map(
        (record) =>
          [
            record.province,
            record.district,
            record.administrativePost
          ].join("|")
      )
    );

  const localityKeys =
    new Set(
      records.map(
        (record) =>
          [
            record.province,
            record.district,
            record.administrativePost,
            record.locality
          ].join("|")
      )
    );

  const neighborhoodKeys =
    new Set(
      records
        .filter(
          (record) =>
            record.neighborhood !==
            null
        )
        .map(
          (record) =>
            [
              record.province,
              record.district,
              record.administrativePost,
              record.locality,
              record.neighborhood
            ].join("|")
        )
    );

  return {
    provinces:
      provinceNames.size,

    districts:
      districtKeys.size,

    administrativePosts:
      postKeys.size,

    localities:
      localityKeys.size,

    neighborhoods:
      neighborhoodKeys.size
  };
}

async function main() {
  const province =
    getProvinceArgument();

  console.log(
    "🌍 Fetching MozGIS / INE 2017 locality layer..."
  );

  console.log(
    `   Province filter: ${province ?? "all Mozambique"}`
  );

  const features =
    await fetchAllFeatures();

  const allRecords =
    deduplicate(
      normalizeFeatures(
        features
      )
    );

  const records =
    filterProvince(
      allRecords,
      province
    );

  const counts =
    buildSummary(
      records
    );

  const output = {
    metadata: {
      classification:
        "HISTORICAL_REFERENCE",

      canonicalStatus:
        "RESEARCH_ONLY",

      sourceInstitution:
        "Instituto Nacional de Estatística / MozGIS",

      sourceYear:
        2017,

      sourceLayer:
        "SociedPopulacaoLocalidadeBairro2017",

      sourceUrl:
        "https://www.mozgis.gov.mz/server/rest/services/MEF/MEFAAPAnaliseInfraestruturas/MapServer/24",

      retrievedAt:
        new Date()
          .toISOString(),

      provinceFilter:
        province,

      warning:
        "Official INE 2017 reference only. Reconcile with newer authoritative sources before promoting records into data/current/."
    },

    counts: {
      rawFeatures:
        features.length,

      allUniqueRecords:
        allRecords.length,

      filteredUniqueRecords:
        records.length,

      ...counts
    },

    records
  };

  const suffix =
    province
      ? slugify(
          province
        )
      : "mozambique";

  const directory =
    path.join(
      process.cwd(),
      "data",
      "research",
      "mozgis"
    );

  await mkdir(
    directory,
    {
      recursive: true
    }
  );

  const outputPath =
    path.join(
      directory,
      `localities-2017-${suffix}.json`
    );

  await writeFile(
    outputPath,
    JSON.stringify(
      output,
      null,
      2
    ) + "\n",
    "utf8"
  );

  console.log(
    "\n✅ MozGIS research snapshot created."
  );

  console.log(
    `   Raw features: ${features.length}`
  );

  console.log(
    `   All unique records: ${allRecords.length}`
  );

  console.log(
    `   Filtered records: ${records.length}`
  );

  console.log(
    `   Provinces: ${counts.provinces}`
  );

  console.log(
    `   Districts: ${counts.districts}`
  );

  console.log(
    `   Administrative posts: ${counts.administrativePosts}`
  );

  console.log(
    `   Localities: ${counts.localities}`
  );

  console.log(
    `   Neighborhoods: ${counts.neighborhoods}`
  );

  console.log(
    `   Output: ${outputPath}`
  );
}

await main();
