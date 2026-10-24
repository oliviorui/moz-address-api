import fs from "node:fs";
import path from "node:path";

type SnapshotRecord = {
  province?: string;
  district?: string;
  administrativePost?: string;
  locality?: string | null;
  neighborhood?: string | null;
};

type Snapshot = {
  records?: SnapshotRecord[];
};

type Province = {
  id: string;
  name: string;
  slug: string;
};

type District = {
  id: string;
  provinceId: string;
  name: string;
  slug: string;
};

type AdministrativePost = {
  id: string;
  districtId: string;
  name: string;
  slug: string;
};

type Source = {
  id: string;
  institution: string;
  title: string;
  type: string;
  year?: number | null;
  url?: string | null;
  accessedAt?: string | null;
  notes?: string | null;
};

type Config = {
  auditOnly?: boolean;
  auditCompare?: Array<"localities" | "neighborhoods" | "administrativePosts">;
  promotionLayers?: Array<"localities" | "neighborhoods">;
  districtAliases?: Record<string, string[]>;
  postAliases?: Record<string, Record<string, string[]>>;
  ignoreHistoricalLocalities?: Record<string, string[]>;
  localityAliases?: Record<string, Record<string, string[]>>;
  province: {
    name: string;
    slug: string;
    expectedAdministrativePosts: number;
    expectedLocalities: number;
    expectedNeighborhoods: number;
    source: string;
    sourcePage?: string | null;
    historicalSourceId: string;
    currentSourceId: string;
  };
  districts: Record<
    string,
    {
      localities: number;
      neighborhoods: number;
    }
  >;
};

type DiagnosticDistrict = {
  district: string;
  expected: {
    localities: number;
    neighborhoods: number;
  };
  historical: {
    localities: number;
    neighborhoods: number;
    administrativePosts: string[];
  };
  current: {
    administrativePosts: string[];
  };
  historicalOnlyPosts: string[];
  currentOnlyPosts: string[];
  status:
    | "EXACT_STRUCTURAL_MATCH"
    | "POST_RECONCILIATION_REQUIRED"
    | "COUNT_GAP";
};

type Diagnostic = {
  province: Config["province"];
  districts: DiagnosticDistrict[];
};

type CanonicalRecord = {
  id: string;
  code: null;
  name: string;
  slug: string;
  type: "LOCALITY" | "NEIGHBORHOOD";
  administrativePostId: string | null;
  districtId: string | null;
};

type LocalitySourceRef = {
  localityId: string;
  sourceId: string;
  page: string | null;
  notes: string;
};

const ROOT = process.cwd();

function readJson<T>(...parts: string[]): T {
  const filePath = path.join(ROOT, ...parts);
  if (!fs.existsSync(filePath)) {
    throw new Error(`Missing required file: ${filePath}`);
  }
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

function normalize(value: string | undefined | null): string {
  return (value ?? "")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[’'`´]/g, "")
    .replace(/[º°]/g, "")
    .replace(/[()[\]{}.,/\\_-]+/g, " ")
    .replace(/\b(cidade|vila|sede)\b/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function isApplicable(value: string | undefined | null): boolean {
  const normalized = normalize(value);
  return Boolean(normalized) && normalized !== "nao aplicavel";
}



function getCurrentLocalityName(
  config: { localityAliases?: Record<string, Record<string, string[]>> },
  districtName: string,
  historicalLocalityName: string,
): string {
  const districtAliases = Object.entries(
    config.localityAliases ?? {},
  ).find(
    ([configuredDistrict]) =>
      normalize(configuredDistrict) === normalize(districtName),
  )?.[1];

  if (!districtAliases) {
    return historicalLocalityName;
  }

  const match = Object.entries(districtAliases).find(
    ([currentName, historicalNames]) =>
      normalize(currentName) === normalize(historicalLocalityName) ||
      historicalNames.some(
        (name) =>
          normalize(name) === normalize(historicalLocalityName),
      ),
  );

  return match?.[0] ?? historicalLocalityName;
}

function shouldIgnoreHistoricalLocality(
  config: { ignoreHistoricalLocalities?: Record<string, string[]> },
  districtName: string,
  localityName: string | undefined | null,
): boolean {
  if (!isApplicable(localityName)) {
    return false;
  }

  const configured = Object.entries(
    config.ignoreHistoricalLocalities ?? {},
  ).find(
    ([configuredDistrict]) =>
      normalize(configuredDistrict) === normalize(districtName),
  )?.[1] ?? [];

  return configured.some(
    (name) => normalize(name) === normalize(localityName),
  );
}

function getPostAliases(
  config: { postAliases?: Record<string, Record<string, string[]>> },
  districtName: string,
  currentPostName: string,
): string[] {
  const districtAliases = Object.entries(
    config.postAliases ?? {},
  ).find(
    ([configuredDistrict]) =>
      normalize(configuredDistrict) === normalize(districtName),
  )?.[1];

  if (!districtAliases) {
    return [];
  }

  return (
    Object.entries(districtAliases).find(
      ([configuredPost]) =>
        normalize(configuredPost) === normalize(currentPostName),
    )?.[1] ?? []
  );
}

function slugify(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/[’'`´]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function idPart(value: string): string {
  return slugify(value).replace(/-/g, "_");
}

function writeJson(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(
    filePath,
    JSON.stringify(value, null, 2) + "\n",
    "utf8",
  );
}

const provinceSlug = process.argv[2];

if (!provinceSlug) {
  throw new Error(
    "Usage: npx tsx scripts/promote-reconciled.ts <province-slug>",
  );
}

const config = readJson<Config>(
  "data",
  "research",
  "reconciliation",
  "config",
  `${provinceSlug}.json`,
);

const promotionLayers = new Set(
  config.promotionLayers ?? ["localities", "neighborhoods"],
);

if (config.auditOnly) {
  const auditCompare = new Set(
    config.auditCompare ??
      ["localities", "neighborhoods", "administrativePosts"],
  );

  const unsafePromotionLayer = [...promotionLayers].find(
    (layer) => !auditCompare.has(layer),
  );

  if (unsafePromotionLayer) {
    throw new Error(
      `${config.province.name}: cannot promote "${unsafePromotionLayer}" because that layer is not included in auditCompare.`,
    );
  }
}

const diagnostic = readJson<Diagnostic>(
  "data",
  "research",
  "reconciliation",
  `${provinceSlug}-diagnostic.json`,
);

if (config.province.slug !== provinceSlug) {
  throw new Error(
    `Config slug mismatch: requested "${provinceSlug}", found "${config.province.slug}".`,
  );
}

if (diagnostic.province.slug !== provinceSlug) {
  throw new Error(
    `Diagnostic slug mismatch: requested "${provinceSlug}", found "${diagnostic.province.slug}".`,
  );
}

const exactDistricts = diagnostic.districts.filter(
  (item) => item.status === "EXACT_STRUCTURAL_MATCH",
);

if (exactDistricts.length === 0) {
  throw new Error(
    `${config.province.name}: diagnostic contains no EXACT_STRUCTURAL_MATCH districts.`,
  );
}

const snapshot = readJson<Snapshot>(
  "data",
  "research",
  "mozgis",
  "localities-2017-mozambique.json",
);

const provinces = readJson<Province[]>(
  "data",
  "current",
  "provinces.json",
);

const districts = readJson<District[]>(
  "data",
  "current",
  "districts.json",
);

const posts = readJson<AdministrativePost[]>(
  "data",
  "current",
  "administrative-posts.json",
);

const sourceRegistry: Source[] = (() => {
  const byId = new Map<string, Source>();

  const addSources = (items: Source[]) => {
    for (const item of items) {
      if (!byId.has(item.id)) {
        byId.set(item.id, item);
      }
    }
  };

  addSources(
    readJson<Source[]>(
      "data",
      "sources",
      "sources.json",
    ),
  );

  const areaDir = path.join(
    ROOT,
    "data",
    "sources",
    "sources-by-area",
  );

  if (fs.existsSync(areaDir)) {
    for (const file of fs
      .readdirSync(areaDir)
      .filter((name) => name.endsWith(".json"))
      .sort()) {
      addSources(
        JSON.parse(
          fs.readFileSync(
            path.join(areaDir, file),
            "utf8",
          ),
        ) as Source[],
      );
    }
  }

  return [...byId.values()];
})();

const province = provinces.find(
  (item) => item.slug === provinceSlug,
);

if (!province) {
  throw new Error(
    `Canonical province not found for slug "${provinceSlug}".`,
  );
}

const historicalSource = sourceRegistry.find(
  (item) =>
    item.id === config.province.historicalSourceId,
);

const currentSource = sourceRegistry.find(
  (item) => item.id === config.province.currentSourceId,
);

if (!historicalSource) {
  throw new Error(
    `Missing source registry entry "${config.province.historicalSourceId}".`,
  );
}

if (!currentSource) {
  throw new Error(
    `Missing source registry entry "${config.province.currentSourceId}".`,
  );
}

const snapshotRecords = snapshot.records ?? [];
const outputRecords: CanonicalRecord[] = [];
const sourceRefs: LocalitySourceRef[] = [];
const seenIds = new Set<string>();

const summary: {
  district: string;
  localities: number;
  neighborhoods: number;
}[] = [];

for (const diagnosticDistrict of exactDistricts) {
  const district = districts.find(
    (item) =>
      item.provinceId === province.id &&
      item.name === diagnosticDistrict.district,
  );

  if (!district) {
    throw new Error(
      `Canonical district not found: "${diagnosticDistrict.district}".`,
    );
  }

  const districtPosts = posts.filter(
    (item) => item.districtId === district.id,
  );

  const historicalDistrictNames = [
    district.name,
    ...(config.districtAliases?.[district.name] ?? []),
  ].map(normalize);

  const historicalRecords = snapshotRecords.filter(
    (record) =>
      normalize(record.province) === normalize(config.province.name) &&
      historicalDistrictNames.includes(normalize(record.district)) &&
      (isApplicable(record.locality) || isApplicable(record.neighborhood)) &&
      !shouldIgnoreHistoricalLocality(
        config,
        district.name,
        record.locality,
      ),
  );

  const localityCount = historicalRecords.filter(
    (record) =>
      isApplicable(record.locality) &&
      !isApplicable(record.neighborhood),
  ).length;

  const neighborhoodCount = historicalRecords.filter(
    (record) => isApplicable(record.neighborhood),
  ).length;

  if (
    promotionLayers.has("localities") &&
    localityCount !== diagnosticDistrict.expected.localities
  ) {
    throw new Error(
      `${district.name}: historical locality records changed since diagnostic; expected ${diagnosticDistrict.expected.localities}, found ${localityCount}.`,
    );
  }

  if (
    promotionLayers.has("neighborhoods") &&
    neighborhoodCount !== diagnosticDistrict.expected.neighborhoods
  ) {
    throw new Error(
      `${district.name}: historical neighborhood records changed since diagnostic; expected ${diagnosticDistrict.expected.neighborhoods}, found ${neighborhoodCount}.`,
    );
  }

  const promotableHistoricalRecords = historicalRecords.filter(
    (record) =>
      (promotionLayers.has("localities") &&
        isApplicable(record.locality) &&
        !isApplicable(record.neighborhood)) ||
      (promotionLayers.has("neighborhoods") &&
        isApplicable(record.neighborhood)),
  );

  for (const historical of promotableHistoricalRecords) {
    const type: CanonicalRecord["type"] = isApplicable(
      historical.neighborhood,
    )
      ? "NEIGHBORHOOD"
      : "LOCALITY";

    const name =
      type === "NEIGHBORHOOD"
        ? historical.neighborhood
        : historical.locality;

    if (!name || !isApplicable(name)) {
      throw new Error(
        `${district.name}: historical record has neither locality nor neighborhood name.`,
      );
    }

    let administrativePostId: string | null = null;
    let directDistrictId: string | null = null;
    let postPart = "";

    if (isApplicable(historical.administrativePost)) {
      const normalizedPost = normalize(
        historical.administrativePost,
      );

      const matches = districtPosts.filter((post) => {
        const accepted = new Set<string>([
          normalize(post.name),
          ...getPostAliases(
            config,
            district.name,
            post.name,
          ).map(normalize),
        ]);

        return accepted.has(normalizedPost);
      });

      if (matches.length === 1) {
        administrativePostId = matches[0].id;
        postPart = `_${idPart(matches[0].slug || matches[0].name)}`;
      } else if (matches.length === 0 && districtPosts.length === 0) {
        directDistrictId = district.id;
      } else {
        throw new Error(
          `${district.name}: historical post "${historical.administrativePost}" resolved to ${matches.length} canonical posts.`,
        );
      }
    } else {
      directDistrictId = district.id;
    }

    const prefix =
      type === "NEIGHBORHOOD"
        ? "neighborhood"
        : "locality";

    const id = `${prefix}_${idPart(province.slug)}_${idPart(
      district.slug,
    )}${postPart}_${idPart(name)}`;

    if (seenIds.has(id)) {
      throw new Error(
        `Duplicate generated id: ${id}`,
      );
    }

    seenIds.add(id);

    outputRecords.push({
      id,
      code: null,
      name,
      slug: slugify(name),
      type,
      administrativePostId,
      districtId: directDistrictId,
    });

    sourceRefs.push(
      {
        localityId: id,
        sourceId: historicalSource.id,
        page: null,
        notes:
          `Name and hierarchy taken from official INE/MozGIS 2017 after exact structural reconciliation for ${config.province.name}.`,
      },
      {
        localityId: id,
        sourceId: currentSource.id,
        page: config.province.sourcePage ?? null,
        notes:
          `Current ${config.province.name} territorial counts confirm this exact structural batch.`,
      },
    );
  }

  summary.push({
    district: district.name,
    localities: promotionLayers.has("localities") ? localityCount : 0,
    neighborhoods: promotionLayers.has("neighborhoods")
      ? neighborhoodCount
      : 0,
  });
}

outputRecords.sort((a, b) =>
  a.id.localeCompare(b.id, "en"),
);

sourceRefs.sort((a, b) =>
  `${a.localityId}:${a.sourceId}`.localeCompare(
    `${b.localityId}:${b.sourceId}`,
    "en",
  ),
);

const expectedPromotedCount = exactDistricts.reduce(
  (sum, item) =>
    sum +
    (promotionLayers.has("localities")
      ? item.expected.localities
      : 0) +
    (promotionLayers.has("neighborhoods")
      ? item.expected.neighborhoods
      : 0),
  0,
);

if (outputRecords.length !== expectedPromotedCount) {
  throw new Error(
    `Expected to promote ${expectedPromotedCount} records, generated ${outputRecords.length}.`,
  );
}

const promotedLayerSuffix =
  promotionLayers.size === 2
    ? "exact"
    : [...promotionLayers].sort().join("-") + "-exact";

const areaName = `${provinceSlug}-${promotedLayerSuffix}`;

const canonicalPath = path.join(
  ROOT,
  "data",
  "current",
  "localities-by-area",
  `${areaName}.json`,
);

const localitySourcesPath = path.join(
  ROOT,
  "data",
  "sources",
  "locality-sources-by-area",
  `${areaName}.json`,
);

const sourcesPath = path.join(
  ROOT,
  "data",
  "sources",
  "sources-by-area",
  `${areaName}.json`,
);

writeJson(canonicalPath, outputRecords);
writeJson(localitySourcesPath, sourceRefs);
writeJson(
  sourcesPath,
  [historicalSource, currentSource],
);

console.log(
  `✅ ${config.province.name}: promoted exact structural matches`,
);

for (const item of summary) {
  console.log(
    `   ${item.district}: ${item.localities} localities + ${item.neighborhoods} neighborhoods`,
  );
}

console.log(
  `📦 Promoted ${outputRecords.length} record(s) across ${summary.length} district(s).`,
);

console.log(
  `✅ Wrote ${path.relative(ROOT, canonicalPath)}`,
);

console.log(
  `✅ Wrote ${path.relative(ROOT, localitySourcesPath)}`,
);

console.log(
  `✅ Wrote ${path.relative(ROOT, sourcesPath)}`,
);

const skipped = diagnostic.districts.filter(
  (item) => item.status !== "EXACT_STRUCTURAL_MATCH",
);

if (skipped.length > 0) {
  console.log("⏭️ Skipped unresolved districts:");
  for (const item of skipped) {
    console.log(
      `   ${item.district} — ${item.status}`,
    );
  }
}
