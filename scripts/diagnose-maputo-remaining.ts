import {
  readFile,
  writeFile,
  mkdir
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

type UnmatchedPost = {
  sourceName: string;
  canonicalMatches: Array<{
    id: string;
    name: string;
  }>;
};

type ReportDistrict = {
  districtId: string;
  district: string;
  expectedLocalities: number;
  sourceLocalities: number;
  exactCountMatch: boolean;
  canonicalPosts: number;
  sourcePosts: number;
  allPostsMapped: boolean;
  unmatchedPosts: UnmatchedPost[];
  candidateCount: number;
  promotionReadiness:
    | "READY_FOR_REVIEW"
    | "NEEDS_RECONCILIATION";
  candidates: Candidate[];
};

type ReconciliationReport = {
  districts: ReportDistrict[];
};

const TARGETS = new Set([
  "dist_maputo_boane",
  "dist_maputo_magude",
  "dist_maputo_manhica",
  "dist_maputo_matutuine"
]);

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

function groupByPost(
  candidates: Candidate[]
) {
  const groups =
    new Map<
      string,
      Candidate[]
    >();

  for (const candidate of candidates) {
    const list =
      groups.get(
        candidate.administrativePostId
      ) ?? [];

    list.push(candidate);

    groups.set(
      candidate.administrativePostId,
      list
    );
  }

  return [...groups.entries()]
    .map(
      ([
        administrativePostId,
        items
      ]) => ({
        administrativePostId,
        count:
          items.length,
        localities:
          items
            .map(
              (item) =>
                item.name
            )
            .sort(
              (a, b) =>
                a.localeCompare(b)
            )
      })
    )
    .sort(
      (a, b) =>
        a.administrativePostId
          .localeCompare(
            b.administrativePostId
          )
    );
}

async function main() {
  const root =
    process.cwd();

  const inputPath =
    path.join(
      root,
      "data",
      "research",
      "reconciliation",
      "maputo-mozgis-2017-comparison.json"
    );

  const report =
    await readJson<
      ReconciliationReport
    >(
      inputPath
    );

  const districts =
    report.districts.filter(
      (district) =>
        TARGETS.has(
          district.districtId
        )
    );

  if (
    districts.length !== 4
  ) {
    throw new Error(
      `Expected 4 remaining districts, found ${districts.length}. Re-run the Maputo reconciliation first.`
    );
  }

  const output = districts.map(
    (district) => {
      const delta =
        district.sourceLocalities -
        district.expectedLocalities;

      return {
        districtId:
          district.districtId,

        district:
          district.district,

        expectedLocalities:
          district.expectedLocalities,

        mozgis2017Localities:
          district.sourceLocalities,

        delta,

        canonicalPosts:
          district.canonicalPosts,

        sourcePosts:
          district.sourcePosts,

        allPostsMapped:
          district.allPostsMapped,

        unmatchedPosts:
          district.unmatchedPosts,

        generatedCandidateCount:
          district.candidateCount,

        candidatesByPost:
          groupByPost(
            district.candidates
          ),

        nextAction:
          delta > 0
            ? `Identify ${delta} historical/reclassified locality record(s) that should not be in the current ${district.expectedLocalities}-locality set.`
            : delta < 0
              ? `Identify ${Math.abs(delta)} locality record(s) added after the MozGIS 2017 snapshot.`
              : district.allPostsMapped
                ? "Counts and post mappings align; review names for current-status confirmation."
                : "Locality count aligns, but one or more administrative-post names do not map uniquely to the canonical dataset."
      };
    }
  );

  const outputDir =
    path.join(
      root,
      "data",
      "research",
      "reconciliation"
    );

  await mkdir(
    outputDir,
    {
      recursive: true
    }
  );

  const outputPath =
    path.join(
      outputDir,
      "maputo-remaining-diagnostics.json"
    );

  await writeFile(
    outputPath,
    JSON.stringify(
      {
        generatedAt:
          new Date()
            .toISOString(),
        districts:
          output
      },
      null,
      2
    ) + "\n",
    "utf8"
  );

  console.log(
    "🔎 Remaining Maputo diagnostics\n"
  );

  for (const district of output) {
    const deltaLabel =
      district.delta > 0
        ? `+${district.delta}`
        : String(
            district.delta
          );

    console.log(
      `${district.district}: ${district.mozgis2017Localities}/${district.expectedLocalities} (delta ${deltaLabel})`
    );

    console.log(
      `   posts: source ${district.sourcePosts}, canonical ${district.canonicalPosts}, mapped=${district.allPostsMapped}`
    );

    if (
      district.unmatchedPosts.length >
      0
    ) {
      console.log(
        "   unmatched source posts:"
      );

      for (
        const post of
        district.unmatchedPosts
      ) {
        const matches =
          post.canonicalMatches
            .map(
              (item) =>
                `${item.name} [${item.id}]`
            )
            .join(", ");

        console.log(
          `      - ${post.sourceName} -> ${matches || "(no canonical match)"}`
        );
      }
    }

    console.log(
      "   localities by canonical post:"
    );

    for (
      const group of
      district.candidatesByPost
    ) {
      console.log(
        `      ${group.administrativePostId}: ${group.count}`
      );

      console.log(
        `         ${group.localities.join(", ")}`
      );
    }

    console.log(
      `   next: ${district.nextAction}\n`
    );
  }

  console.log(
    `✅ Diagnostic written to ${outputPath}`
  );
}

await main();
