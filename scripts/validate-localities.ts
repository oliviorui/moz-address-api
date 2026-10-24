import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

type District = {
  id: string;
  name: string;
  type?: "DISTRICT" | "MUNICIPAL_DISTRICT";
};

type AdministrativePost = {
  id: string;
  districtId: string;
};

type Locality = {
  id: string;
  code: string | null;
  name: string;
  slug: string;
  type: "LOCALITY" | "NEIGHBORHOOD";
  administrativePostId: string | null;
  districtId: string | null;
};

type LocalitySource = {
  localityId: string;
  sourceId: string;
};

type Source = {
  id: string;
};

const __filename = fileURLToPath(import.meta.url);
const ROOT = path.resolve(path.dirname(__filename), "..");

function readJson<T>(rel: string): T {
  return JSON.parse(fs.readFileSync(path.join(ROOT, rel), "utf8")) as T;
}

const localities = readJson<Locality[]>("data/generated/localities.json");
const references = readJson<LocalitySource[]>("data/generated/locality-sources.json");
const posts = readJson<AdministrativePost[]>("data/current/administrative-posts.json");
const districts = readJson<District[]>("data/current/districts.json");
const sources = readJson<Source[]>("data/sources/sources.json");

const errors: string[] = [];
const postIds = new Set(posts.map((item) => item.id));
const districtMap = new Map(districts.map((item) => [item.id, item]));
const sourceIds = new Set(sources.map((item) => item.id));

const directNeighborhoodDistrictIds = new Set([
  "dist_inhambane_inhambane",
  "dist_inhambane_maxixe",
  "dist_tete_tete",
  "dist_cabo_delgado_pemba",
  "dist_manica_chimoio",
]);

function allowsDirectNeighborhoods(district: District) {
  return (
    district.type === "MUNICIPAL_DISTRICT" ||
    directNeighborhoodDistrictIds.has(district.id)
  );
}

const ids = new Set<string>();

for (const locality of localities) {
  if (ids.has(locality.id)) {
    errors.push(`Duplicate locality/neighborhood ID: "${locality.id}".`);
  }
  ids.add(locality.id);

  if (!locality.id.trim() || !locality.name.trim() || !locality.slug.trim()) {
    errors.push(`Invalid empty field in "${locality.id}".`);
  }

  const hasPost = locality.administrativePostId !== null;
  const hasDistrict = locality.districtId !== null;

  if (hasPost === hasDistrict) {
    errors.push(`"${locality.id}" must reference exactly one parent.`);
    continue;
  }

  if (hasPost && !postIds.has(locality.administrativePostId!)) {
    errors.push(
      `"${locality.id}" references unknown administrative post "${locality.administrativePostId}".`
    );
  }

  if (hasDistrict) {
    const district = districtMap.get(locality.districtId!);
    if (!district) {
      errors.push(
        `"${locality.id}" references unknown district "${locality.districtId}".`
      );
    } else if (
      locality.type === "NEIGHBORHOOD" &&
      !allowsDirectNeighborhoods(district)
    ) {
      errors.push(
        `Direct district neighborhood "${locality.id}" is not allowed for district "${district.id}".`
      );
    }
  }

  if (locality.type === "LOCALITY" && !hasPost) {
    errors.push(`LOCALITY "${locality.id}" must reference an administrative post.`);
  }
}

const sourced = new Set<string>();
for (const ref of references) {
  if (!ids.has(ref.localityId)) {
    errors.push(`Source reference points to unknown record "${ref.localityId}".`);
  }
  if (!sourceIds.has(ref.sourceId)) {
    errors.push(`Source reference uses unknown source "${ref.sourceId}".`);
  }
  sourced.add(ref.localityId);
}

for (const locality of localities) {
  if (!sourced.has(locality.id)) {
    errors.push(`"${locality.id}" has no source reference.`);
  }
}

const expectedMaputoCityNeighborhoods = new Map<string, number>([
  ["dist_maputo_city_kampfumu", 11],
  ["dist_maputo_city_nlhamankulu", 11],
  ["dist_maputo_city_kamaxakeni", 8],
  ["dist_maputo_city_kamavota", 11],
  ["dist_maputo_city_kamubukwana", 14],
  ["dist_maputo_city_katembe", 5],
  ["dist_maputo_city_kanyaka", 3],
]);

const expectedMatola = new Map<string, number>([
  ["adm_post_maputo_matola_infulene", 15],
  ["adm_post_maputo_matola_machava", 14],
  ["adm_post_maputo_matola_cidade_da_matola", 13],
]);

let maputoCityTotal = 0;

for (const [districtId, expected] of expectedMaputoCityNeighborhoods) {
  const actual = localities.filter(
    (item) =>
      item.type === "NEIGHBORHOOD" &&
      item.districtId === districtId
  ).length;

  maputoCityTotal += actual;

  if (actual !== expected) {
    errors.push(
      `Maputo City district "${districtId}" expected ${expected} neighborhoods, found ${actual}.`
    );
  } else {
    console.log(
      `   ✅ ${districtId}: ${actual}/${expected}`
    );
  }
}

if (maputoCityTotal !== 63) {
  errors.push(
    `Maputo City expected 63 neighborhoods, found ${maputoCityTotal}.`
  );
}

let matolaTotal = 0;
for (const [postId, expected] of expectedMatola) {
  const actual = localities.filter(
    (item) =>
      item.type === "NEIGHBORHOOD" &&
      item.administrativePostId === postId
  ).length;

  matolaTotal += actual;
  if (actual !== expected) {
    errors.push(`Matola post "${postId}" expected ${expected} neighborhoods, found ${actual}.`);
  } else {
    console.log(`   ✅ ${postId}: ${actual}/${expected}`);
  }
}

if (matolaTotal !== 42) {
  errors.push(`Matola expected 42 neighborhoods, found ${matolaTotal}.`);
}

if (
  !localities.some(
    (item) =>
      item.slug === "intaca" &&
      item.administrativePostId === "adm_post_maputo_matola_infulene"
  )
) {
  errors.push("Canonical dataset must contain Intaca under Infulene.");
}

if (errors.length) {
  console.error("\n❌ Canonical locality validation failed:\n");
  for (const error of errors) console.error(` - ${error}`);
  process.exitCode = 1;
} else {
  const localityCount = localities.filter((item) => item.type === "LOCALITY").length;
  const neighborhoodCount = localities.filter((item) => item.type === "NEIGHBORHOOD").length;

  console.log(
    `✅ ${localities.length} canonical records checked (${localityCount} localities + ${neighborhoodCount} neighborhoods).`
  );
  console.log(`✅ ${references.length} source references checked.`);
  console.log("✅ Maputo City municipal coverage: 63/63 neighborhoods.");
  console.log("✅ Matola municipal coverage: 42/42 neighborhoods.");
}
