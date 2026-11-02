import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildExport,
  type ExportInput
} from "./lib/export-data.js";

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), "..");

function readJson<T>(...segments: string[]): T {
  return JSON.parse(
    fs.readFileSync(path.join(ROOT, ...segments), "utf8")
  ) as T;
}

const { version } =
  readJson<{ version: string }>("package.json");

const files = buildExport({
  provinces:
    readJson<ExportInput["provinces"]>("data", "current", "provinces.json"),
  districts:
    readJson<ExportInput["districts"]>("data", "current", "districts.json"),
  administrativePosts:
    readJson<ExportInput["administrativePosts"]>("data", "current", "administrative-posts.json"),
  localities:
    readJson<ExportInput["localities"]>("data", "generated", "localities.json"),
  localitySources:
    readJson<ExportInput["localitySources"]>("data", "generated", "locality-sources.json"),
  sources:
    readJson<ExportInput["sources"]>("data", "sources", "sources.json"),
  coverage:
    readJson<ExportInput["coverage"]>("data", "generated", "coverage.json")
});

const releaseRoot = path.join(ROOT, "release");
const outputDir = path.join(releaseRoot, `moz-address-data-${version}`);

fs.rmSync(releaseRoot, { recursive: true, force: true });
fs.mkdirSync(outputDir, { recursive: true });

for (const [name, content] of files) {
  fs.writeFileSync(path.join(outputDir, name), content, "utf8");
}

console.log(`✅ Exported ${files.size} files to ${path.relative(ROOT, outputDir)}.`);
