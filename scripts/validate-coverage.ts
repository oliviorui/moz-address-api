import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  checkDistrictCoverage,
  checkProvinceCoverage,
  type ProvinceCoverage
} from "./lib/data-rules.js";

type District = {
  id: string;
  provinceId: string;
};

type AdministrativePost = {
  id: string;
  districtId: string;
};

type Locality = {
  type: "LOCALITY" | "NEIGHBORHOOD";
  administrativePostId: string | null;
  districtId: string | null;
};

type Source = {
  id: string;
};

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), "..");

async function readJson<T>(...segments: string[]): Promise<T> {
  const content = await readFile(
    path.join(rootDir, "data", ...segments),
    "utf8"
  );

  return JSON.parse(content) as T;
}

async function main() {
  console.log("🔎 Validating province coverage...");

  const [coverage, districts, posts, localities, sources] =
    await Promise.all([
      readJson<ProvinceCoverage[]>("generated", "coverage.json"),
      readJson<District[]>("current", "districts.json"),
      readJson<AdministrativePost[]>("current", "administrative-posts.json"),
      readJson<Locality[]>("generated", "localities.json"),
      readJson<Source[]>("sources", "sources.json")
    ]);

  const errors: string[] = [];
  const sourceIds = new Set(sources.map((source) => source.id));
  const provinceOfDistrict = new Map(
    districts.map((district) => [district.id, district.provinceId])
  );
  const districtOfPost = new Map(
    posts.map((post) => [post.id, post.districtId])
  );

  const provinceIds = new Set(
    districts.map((district) => district.provinceId)
  );

  for (const provinceId of provinceIds) {
    if (!coverage.some((item) => item.provinceId === provinceId)) {
      errors.push(`Province "${provinceId}" has no coverage file.`);
    }
  }

  const loadedByDistrict = new Map<
    string,
    { localities: number; neighborhoods: number }
  >();

  for (const locality of localities) {
    const districtId =
      locality.districtId ??
      districtOfPost.get(locality.administrativePostId ?? "");

    if (!districtId) {
      continue;
    }

    const loaded =
      loadedByDistrict.get(districtId) ?? {
        localities: 0,
        neighborhoods: 0
      };

    if (locality.type === "LOCALITY") {
      loaded.localities += 1;
    } else {
      loaded.neighborhoods += 1;
    }

    loadedByDistrict.set(districtId, loaded);
  }

  for (const item of coverage) {
    const districtIds = districts
      .filter((district) => district.provinceId === item.provinceId)
      .map((district) => district.id);

    const loaded = {
      administrativePosts: posts.filter(
        (post) =>
          provinceOfDistrict.get(post.districtId) === item.provinceId
      ).length,

      localities: districtIds.reduce(
        (total, id) =>
          total + (loadedByDistrict.get(id)?.localities ?? 0),
        0
      ),

      neighborhoods: districtIds.reduce(
        (total, id) =>
          total + (loadedByDistrict.get(id)?.neighborhoods ?? 0),
        0
      )
    };

    errors.push(
      ...checkProvinceCoverage(item, loaded),
      ...checkDistrictCoverage(item, loadedByDistrict)
    );

    for (const sourceId of item.sourceIds) {
      if (!sourceIds.has(sourceId)) {
        errors.push(
          `${item.province}: unknown source "${sourceId}".`
        );
      }
    }

    for (const district of item.districts ?? []) {
      if (!districtIds.includes(district.districtId)) {
        errors.push(
          `${item.province}: district "${district.districtId}" belongs to another province.`
        );
      }
    }

    const format = (layer: keyof typeof loaded) =>
      `${loaded[layer]}/${item.expected[layer] ?? "?"}`;

    console.log(
      `   ${item.status === "COMPLETE" ? "✅" : "⏳"} ${item.province}: posts ${format("administrativePosts")}, localities ${format("localities")}, neighborhoods ${format("neighborhoods")}`
    );
  }

  if (errors.length > 0) {
    console.error("\n❌ Coverage validation failed:\n");

    for (const error of errors) {
      console.error(` - ${error}`);
    }

    process.exitCode = 1;
    return;
  }

  console.log("\n✅ Coverage files explain every known gap.");
}

await main();
