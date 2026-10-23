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
  slug?: string;
};

type DistrictExpectation = {
  localities: number;
  neighborhoods: number;
};

type ReconciliationConfig = {
  districtAliases?: Record<string, string[]>;
  postAliases?: Record<string, Record<string, string[]>>;
  province: {
    name: string;
    slug: string;
    expectedAdministrativePosts: number;
    expectedLocalities: number;
    expectedNeighborhoods: number;
    source: string;
    sourcePage?: string | null;
  };
  districts: Record<string, DistrictExpectation>;
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

const provinceSlug = process.argv[2];

if (!provinceSlug) {
  throw new Error(
    "Usage: npx tsx scripts/reconcile-province.ts <province-slug>",
  );
}

const configPath = path.join(
  ROOT,
  "data",
  "research",
  "reconciliation",
  "config",
  `${provinceSlug}.json`,
);

if (!fs.existsSync(configPath)) {
  throw new Error(`Missing reconciliation config: ${configPath}`);
}

const config = JSON.parse(
  fs.readFileSync(configPath, "utf8"),
) as ReconciliationConfig;

if (config.province.slug !== provinceSlug) {
  throw new Error(
    `Config slug mismatch: requested "${provinceSlug}", config has "${config.province.slug}".`,
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

const province = provinces.find(
  (p) => p.slug === config.province.slug,
);

if (!province) {
  throw new Error(
    `Canonical province not found for slug "${config.province.slug}".`,
  );
}

const provinceDistricts = districts.filter(
  (d) => d.provinceId === province.id,
);

const configuredDistrictNames = Object.keys(config.districts);

if (provinceDistricts.length !== configuredDistrictNames.length) {
  throw new Error(
    `${config.province.name}: canonical districts ${provinceDistricts.length}, configured districts ${configuredDistrictNames.length}.`,
  );
}

const currentPosts = posts.filter((p) =>
  provinceDistricts.some((d) => d.id === p.districtId),
);

if (
  currentPosts.length !==
  config.province.expectedAdministrativePosts
) {
  throw new Error(
    `${config.province.name}: expected ${config.province.expectedAdministrativePosts} canonical administrative posts, found ${currentPosts.length}.`,
  );
}

const snapshotRecords = snapshot.records ?? [];

const historicalProvinceRecords = snapshotRecords.filter(
  (r) =>
    normalize(r.province) === normalize(config.province.name),
);

type DistrictResult = {
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

const results: DistrictResult[] = [];

for (const district of provinceDistricts) {
  const expectation = config.districts[district.name];

  if (!expectation) {
    throw new Error(
      `No configured expectation for district "${district.name}".`,
    );
  }

  const historicalDistrictNames = [
    district.name,
    ...(config.districtAliases?.[district.name] ?? []),
  ].map(normalize);

  const historical = historicalProvinceRecords.filter(
    (r) => historicalDistrictNames.includes(normalize(r.district)),
  );

  const historicalLocalities = historical.filter(
    (r) =>
      isApplicable(r.locality) &&
      !isApplicable(r.neighborhood),
  ).length;

  const historicalNeighborhoods = historical.filter(
    (r) => isApplicable(r.neighborhood),
  ).length;

  const historicalPostNames = [
    ...new Set(
      historical
        .map((r) => r.administrativePost)
        .filter(
          (v): v is string => isApplicable(v),
        ),
    ),
  ].sort((a, b) => a.localeCompare(b, "pt"));

  const canonicalPostNames = currentPosts
    .filter((p) => p.districtId === district.id)
    .map((p) => p.name)
    .sort((a, b) => a.localeCompare(b, "pt"));

  const historicalByNormalized = new Map(
    historicalPostNames.map((name) => [normalize(name), name]),
  );

  const acceptedHistoricalNamesByCurrent =
    new Map<string, Set<string>>();

  for (const currentName of canonicalPostNames) {
    const accepted = new Set<string>([
      normalize(currentName),
      ...getPostAliases(
        config,
        district.name,
        currentName,
      ).map(normalize),
    ]);

    acceptedHistoricalNamesByCurrent.set(
      currentName,
      accepted,
    );
  }

  const historicalOnlyPosts = historicalPostNames.filter(
    (historicalName) =>
      ![...acceptedHistoricalNamesByCurrent.values()].some(
        (accepted) =>
          accepted.has(normalize(historicalName)),
      ),
  );

  const currentOnlyPosts = canonicalPostNames.filter(
    (currentName) => {
      const accepted =
        acceptedHistoricalNamesByCurrent.get(currentName) ??
        new Set([normalize(currentName)]);

      return !historicalPostNames.some(
        (historicalName) =>
          accepted.has(normalize(historicalName)),
      );
    },
  );

  const countGap =
    historicalLocalities !== expectation.localities ||
    historicalNeighborhoods !== expectation.neighborhoods;

  const status: DistrictResult["status"] = countGap
    ? "COUNT_GAP"
    : historicalOnlyPosts.length > 0 ||
        currentOnlyPosts.length > 0
      ? "POST_RECONCILIATION_REQUIRED"
      : "EXACT_STRUCTURAL_MATCH";

  results.push({
    district: district.name,
    expected: expectation,
    historical: {
      localities: historicalLocalities,
      neighborhoods: historicalNeighborhoods,
      administrativePosts: historicalPostNames,
    },
    current: {
      administrativePosts: canonicalPostNames,
    },
    historicalOnlyPosts,
    currentOnlyPosts,
    status,
  });
}

const historicalTotals = results.reduce(
  (acc, item) => {
    acc.localities += item.historical.localities;
    acc.neighborhoods += item.historical.neighborhoods;
    return acc;
  },
  { localities: 0, neighborhoods: 0 },
);

const expectedTotals = Object.values(config.districts).reduce(
  (acc, item) => {
    acc.localities += item.localities;
    acc.neighborhoods += item.neighborhoods;
    return acc;
  },
  { localities: 0, neighborhoods: 0 },
);

if (
  expectedTotals.localities !== config.province.expectedLocalities ||
  expectedTotals.neighborhoods !==
    config.province.expectedNeighborhoods
) {
  throw new Error(
    `${config.province.name}: district expectations do not sum to province totals.`,
  );
}

const summary = {
  exactStructuralMatches: results.filter(
    (r) => r.status === "EXACT_STRUCTURAL_MATCH",
  ).length,
  postReconciliationRequired: results.filter(
    (r) => r.status === "POST_RECONCILIATION_REQUIRED",
  ).length,
  countGaps: results.filter(
    (r) => r.status === "COUNT_GAP",
  ).length,
};

const report = {
  generatedAt: new Date().toISOString(),
  province: config.province,
  totals: {
    historical: historicalTotals,
    expectedCurrent: expectedTotals,
    canonicalAdministrativePosts: currentPosts.length,
  },
  summary,
  districts: results,
};

const outPath = path.join(
  ROOT,
  "data",
  "research",
  "reconciliation",
  `${provinceSlug}-diagnostic.json`,
);

fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(
  outPath,
  JSON.stringify(report, null, 2) + "\n",
  "utf8",
);

console.log(
  `🔎 ${config.province.name} current-vs-historical reconciliation`,
);

for (const item of results) {
  const icon =
    item.status === "EXACT_STRUCTURAL_MATCH"
      ? "✅"
      : item.status === "COUNT_GAP"
        ? "⛔"
        : "⚠️";

  console.log(
    `${icon} ${item.district}: localities ${item.historical.localities}/${item.expected.localities}, neighborhoods ${item.historical.neighborhoods}/${item.expected.neighborhoods} — ${item.status}`,
  );

  if (item.historicalOnlyPosts.length > 0) {
    console.log(
      `   historical-only posts: ${item.historicalOnlyPosts.join(", ")}`,
    );
  }

  if (item.currentOnlyPosts.length > 0) {
    console.log(
      `   current-only posts: ${item.currentOnlyPosts.join(", ")}`,
    );
  }
}

console.log("");
console.log(`📊 ${config.province.name} totals`);
console.log(
  `   Historical: ${historicalTotals.localities} localities + ${historicalTotals.neighborhoods} neighborhoods`,
);
console.log(
  `   Current expected: ${expectedTotals.localities} localities + ${expectedTotals.neighborhoods} neighborhoods`,
);
console.log(
  `   Administrative posts: ${currentPosts.length}/${config.province.expectedAdministrativePosts}`,
);
console.log(
  `   Exact structural matches: ${summary.exactStructuralMatches}`,
);
console.log(
  `   Post reconciliation required: ${summary.postReconciliationRequired}`,
);
console.log(`   Count gaps: ${summary.countGaps}`);
console.log(
  `✅ Wrote ${path.relative(ROOT, outPath)}`,
);
console.log("⚠️ No canonical data was modified.");
