import type {
  NameEvidence,
  ProvinceCoverage
} from "./data-rules.js";

type Row = Record<string, unknown>;

export type ExportInput = {
  provinces: {
    id: string;
    name: string;
    slug: string;
    type: string;
    capital: string | null;
  }[];
  districts: {
    id: string;
    name: string;
    slug: string;
    provinceId: string;
    type?: string;
  }[];
  administrativePosts: {
    id: string;
    name: string;
    slug: string;
    districtId: string;
  }[];
  localities: {
    id: string;
    name: string;
    slug: string;
    type: "LOCALITY" | "NEIGHBORHOOD";
    nameEvidence: NameEvidence | null;
    administrativePostId: string | null;
    districtId: string | null;
  }[];
  localitySources: {
    localityId: string;
    sourceId: string;
    supports: "NAME" | "COUNT";
    page: string | null;
    notes: string | null;
  }[];
  sources: {
    id: string;
    institution: string;
    title: string;
    type: string;
    isHistorical: boolean;
    year: number | null;
    url: string | null;
    accessedAt: string | null;
    notes: string | null;
  }[];
  coverage: ProvinceCoverage[];
};

function csvValue(value: unknown) {
  if (value === null || value === undefined) {
    return "";
  }

  const text = String(value);

  return /[",\r\n]/.test(text)
    ? `"${text.replace(/"/g, '""')}"`
    : text;
}

export function toCsv(
  columns: string[],
  rows: Row[]
) {
  return [
    columns.join(","),
    ...rows.map((row) =>
      columns
        .map((column) => csvValue(row[column]))
        .join(",")
    )
  ].join("\n") + "\n";
}

/*
 * JSON keeps the API's camelCase names, while CSV uses
 * snake_case, which spreadsheets and databases expect.
 */
function toSnakeCase(key: string) {
  return key.replace(
    /[A-Z]/g,
    (letter) => `_${letter.toLowerCase()}`
  );
}

function renderDataset(
  name: string,
  rows: Row[],
  files: Map<string, string>
) {
  const columns =
    Object.keys(rows[0] ?? {});

  const csvRows =
    rows.map((row) =>
      Object.fromEntries(
        Object.entries(row).map(
          ([key, value]) => [
            toSnakeCase(key),
            value
          ]
        )
      )
    );

  files.set(
    `${name}.json`,
    JSON.stringify(rows, null, 2) + "\n"
  );

  files.set(
    `${name}.csv`,
    toCsv(
      columns.map(toSnakeCase),
      csvRows
    )
  );
}

function missing(
  loaded: number,
  expected: number | null
) {
  return expected === null
    ? null
    : Math.max(expected - loaded, 0);
}

function buildReadme(input: ExportInput) {
  const count = (evidence: NameEvidence) =>
    input.localities.filter(
      (locality) =>
        locality.nameEvidence === evidence
    ).length;

  return `# moz-address-api dataset

Mozambique's administrative divisions, from https://github.com/oliviorui/moz-address-api

Each dataset is provided as UTF-8 JSON and CSV. This is an independent project, not an official publication. See DATA_LICENSE.md in the repository for the license and sources.

This product was adapted from the Statistical Office of Mozambique’s information, which is licensed under the National Institute of statistic’s Open License Agreement: https://www.ine.gov.mz/web/guest/license

| File | Contents |
| --- | --- |
| \`provinces\` | ${input.provinces.length} provinces, including Cidade de Maputo |
| \`districts\` | ${input.districts.length} districts and municipal districts |
| \`administrative-posts\` | ${input.administrativePosts.length} administrative posts |
| \`localities\` | ${input.localities.length} localities and neighborhoods, with their full hierarchy |
| \`locality-sources\` | The sources behind each locality and neighborhood |
| \`sources\` | ${input.sources.length} sources |
| \`coverage\` | Records loaded against the verified targets for each province |

## This dataset is incomplete

Some provinces have known gaps. \`coverage\` shows what is missing, and \`coverage.json\` explains why.

## How far to trust a name

Reaching a target only shows that the number of records matches. Check \`nameEvidence\` (\`name_evidence\` in CSV) if you depend on current names:

| Value | Meaning | Records |
| --- | --- | ---: |
| \`CURRENT_SOURCE\` | A current source lists this name. | ${count("CURRENT_SOURCE")} |
| \`HISTORICAL_SOURCE_COUNT_CONFIRMED\` | The name comes from a historical source. A current source confirms only the number of records in the district. | ${count("HISTORICAL_SOURCE_COUNT_CONFIRMED")} |
| \`HISTORICAL_SOURCE_ONLY\` | The name comes from a historical source with no current confirmation. | ${count("HISTORICAL_SOURCE_ONLY")} |

A name, spelling or parent may have changed since a source was published.
`;
}

export function buildExport(
  input: ExportInput
) {
  const files = new Map<string, string>();

  const provinceById = new Map(
    input.provinces.map((item) => [item.id, item])
  );
  const districtById = new Map(
    input.districts.map((item) => [item.id, item])
  );
  const postById = new Map(
    input.administrativePosts.map((item) => [item.id, item])
  );

  renderDataset(
    "provinces",
    input.provinces.map(
      ({ id, name, slug, type, capital }) => ({
        id,
        name,
        slug,
        type: type === "capital-city"
          ? "CAPITAL_CITY"
          : "PROVINCE",
        capital
      })
    ),
    files
  );

  renderDataset(
    "districts",
    input.districts.map((district) => ({
      id: district.id,
      name: district.name,
      slug: district.slug,
      type: district.type ?? "DISTRICT",
      provinceId: district.provinceId,
      province:
        provinceById.get(district.provinceId)?.name ?? null
    })),
    files
  );

  renderDataset(
    "administrative-posts",
    input.administrativePosts.map((post) => {
      const district =
        districtById.get(post.districtId);

      return {
        id: post.id,
        name: post.name,
        slug: post.slug,
        districtId: post.districtId,
        district: district?.name ?? null,
        provinceId: district?.provinceId ?? null,
        province:
          provinceById.get(district?.provinceId ?? "")?.name ?? null
      };
    }),
    files
  );

  const localities =
    input.localities.map((locality) => {
      const post =
        postById.get(locality.administrativePostId ?? "");

      const districtId =
        locality.districtId ?? post?.districtId ?? null;

      const district =
        districtById.get(districtId ?? "");

      return {
        id: locality.id,
        name: locality.name,
        slug: locality.slug,
        type: locality.type,
        nameEvidence: locality.nameEvidence,
        provinceId: district?.provinceId ?? null,
        province:
          provinceById.get(district?.provinceId ?? "")?.name ?? null,
        districtId,
        district: district?.name ?? null,
        administrativePostId:
          locality.administrativePostId,
        administrativePost: post?.name ?? null
      };
    });

  renderDataset("localities", localities, files);

  renderDataset(
    "locality-sources",
    input.localitySources.map(
      ({ localityId, sourceId, supports, page, notes }) => ({
        localityId,
        sourceId,
        supports,
        page,
        notes
      })
    ),
    files
  );

  renderDataset(
    "sources",
    input.sources.map(
      ({
        id,
        institution,
        title,
        type,
        isHistorical,
        year,
        url,
        accessedAt,
        notes
      }) => ({
        id,
        institution,
        title,
        type,
        isHistorical,
        year,
        url,
        accessedAt,
        notes
      })
    ),
    files
  );

  const coverage =
    input.coverage.map((item) => {
      const inProvince =
        localities.filter(
          (locality) =>
            locality.provinceId === item.provinceId
        );

      const layer = (
        loaded: number,
        expected: number | null
      ) => ({
        loaded,
        expected,
        missing: missing(loaded, expected)
      });

      return {
        provinceId: item.provinceId,
        province: item.province,
        status: item.status,

        administrativePosts: layer(
          input.administrativePosts.filter(
            (post) =>
              districtById.get(post.districtId)?.provinceId ===
              item.provinceId
          ).length,
          item.expected.administrativePosts
        ),

        localities: layer(
          inProvince.filter(
            (locality) => locality.type === "LOCALITY"
          ).length,
          item.expected.localities
        ),

        neighborhoods: layer(
          inProvince.filter(
            (locality) => locality.type === "NEIGHBORHOOD"
          ).length,
          item.expected.neighborhoods
        ),

        blockers: item.blockers,
        notes: item.notes,
        sourceIds: item.sourceIds
      };
    });

  files.set(
    "coverage.json",
    JSON.stringify(coverage, null, 2) + "\n"
  );

  const coverageColumns = [
    "province_id",
    "province",
    "status",
    ...[
      "administrative_posts",
      "localities",
      "neighborhoods"
    ].flatMap((name) => [
      `${name}_loaded`,
      `${name}_expected`,
      `${name}_missing`
    ])
  ];

  files.set(
    "coverage.csv",
    toCsv(
      coverageColumns,
      coverage.map((item) => ({
        province_id: item.provinceId,
        province: item.province,
        status: item.status,

        administrative_posts_loaded:
          item.administrativePosts.loaded,
        administrative_posts_expected:
          item.administrativePosts.expected,
        administrative_posts_missing:
          item.administrativePosts.missing,

        localities_loaded:
          item.localities.loaded,
        localities_expected:
          item.localities.expected,
        localities_missing:
          item.localities.missing,

        neighborhoods_loaded:
          item.neighborhoods.loaded,
        neighborhoods_expected:
          item.neighborhoods.expected,
        neighborhoods_missing:
          item.neighborhoods.missing
      }))
    )
  );

  files.set("README.md", buildReadme(input));

  return files;
}
