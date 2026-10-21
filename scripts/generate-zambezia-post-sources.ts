import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

type AdministrativePost = {
  id: string;
  districtId: string;
};

type AdministrativePostSource = {
  administrativePostId: string;
  sourceId: string;
  page: string | null;
  notes: string | null;
};

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, "..");

const postsPath = path.join(
  rootDir,
  "data",
  "current",
  "administrative-posts.json"
);

const referencesPath = path.join(
  rootDir,
  "data",
  "sources",
  "administrative-post-sources.json"
);

const posts = JSON.parse(
  await readFile(postsPath, "utf8")
) as AdministrativePost[];

const references = JSON.parse(
  await readFile(referencesPath, "utf8")
) as AdministrativePostSource[];

const sourceId =
  "ine-zambezia-territorial-statistics";

const existing = new Set(
  references.map(
    (reference) =>
      `${reference.administrativePostId}:${reference.sourceId}`
  )
);

const zambeziaPosts = posts.filter(
  (post) =>
    post.id.startsWith(
      "adm_post_zambezia_"
    )
);

let added = 0;

for (const post of zambeziaPosts) {
  const key =
    `${post.id}:${sourceId}`;

  if (existing.has(key)) {
    continue;
  }

  references.push({
    administrativePostId: post.id,
    sourceId,
    page: null,
    notes:
      "Verified in official INE territorial statistics for Zambézia Province."
  });

  existing.add(key);
  added += 1;
}

await writeFile(
  referencesPath,
  `${JSON.stringify(references, null, 2)}\n`,
  "utf8"
);

console.log(
  `✅ Added ${added} Zambézia administrative post source reference(s).`
);