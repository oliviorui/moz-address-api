import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type LocalityRecord = {
  id: string;
  code: string | null;
  name: string;
  slug: string;
  type: "LOCALITY" | "NEIGHBORHOOD";
  administrativePostId: string | null;
  districtId: string | null;
};

type LocalitySourceReference = {
  localityId: string;
  sourceId: string;
  page: string | null;
  notes: string | null;
};

type SourceRecord = {
  id: string;
};

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), "..");

function readJson<T>(file: string): T {
  return JSON.parse(fs.readFileSync(file, "utf8")) as T;
}

function writeJson(file: string, value: unknown) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(value, null, 2) + "\n", "utf8");
}

const provinceRoot = path.join(ROOT, "data", "current", "by-province");
const sourceRoot = path.join(ROOT, "data", "sources", "by-province");
const generatedRoot = path.join(ROOT, "data", "generated");

const provinceDirs = fs.readdirSync(provinceRoot, { withFileTypes: true })
  .filter((entry) => entry.isDirectory())
  .map((entry) => entry.name)
  .sort();

const records: LocalityRecord[] = [];
const references: LocalitySourceReference[] = [];

for (const province of provinceDirs) {
  const currentDir = path.join(provinceRoot, province);
  const sourceDir = path.join(sourceRoot, province);

  const localities = readJson<LocalityRecord[]>(
    path.join(currentDir, "localities.json")
  );
  const neighborhoods = readJson<LocalityRecord[]>(
    path.join(currentDir, "neighborhoods.json")
  );

  if (localities.some((item) => item.type !== "LOCALITY")) {
    throw new Error(`${province}/localities.json contains a non-LOCALITY record.`);
  }
  if (neighborhoods.some((item) => item.type !== "NEIGHBORHOOD")) {
    throw new Error(`${province}/neighborhoods.json contains a non-NEIGHBORHOOD record.`);
  }

  records.push(...localities, ...neighborhoods);

  references.push(
    ...readJson<LocalitySourceReference[]>(
      path.join(sourceDir, "locality-references.json")
    ),
    ...readJson<LocalitySourceReference[]>(
      path.join(sourceDir, "neighborhood-references.json")
    ),
  );
}

const recordIds = new Set<string>();
for (const record of records) {
  if (recordIds.has(record.id)) {
    throw new Error(`Duplicate canonical locality/neighborhood ID: ${record.id}`);
  }
  recordIds.add(record.id);
}

const refKeys = new Set<string>();
for (const ref of references) {
  const key = `${ref.localityId}::${ref.sourceId}`;
  if (refKeys.has(key)) {
    throw new Error(`Duplicate locality source reference: ${key}`);
  }
  refKeys.add(key);

  if (!recordIds.has(ref.localityId)) {
    throw new Error(`Source reference points to unknown locality: ${ref.localityId}`);
  }
}

const sourceCatalog = readJson<SourceRecord[]>(
  path.join(ROOT, "data", "sources", "sources.json")
);
const sourceIds = new Set(sourceCatalog.map((item) => item.id));

for (const ref of references) {
  if (!sourceIds.has(ref.sourceId)) {
    throw new Error(`Source reference uses unknown source: ${ref.sourceId}`);
  }
}

records.sort((a, b) => a.id.localeCompare(b.id));
references.sort((a, b) =>
  a.localityId.localeCompare(b.localityId) ||
  a.sourceId.localeCompare(b.sourceId)
);

fs.rmSync(generatedRoot, { recursive: true, force: true });
writeJson(path.join(generatedRoot, "localities.json"), records);
writeJson(path.join(generatedRoot, "locality-sources.json"), references);

const localities = records.filter((item) => item.type === "LOCALITY").length;
const neighborhoods = records.filter((item) => item.type === "NEIGHBORHOOD").length;

console.log(
  `✅ Built canonical generated dataset: ${records.length} records (${localities} localities + ${neighborhoods} neighborhoods).`
);
console.log(`✅ Built ${references.length} locality/neighborhood source references.`);
