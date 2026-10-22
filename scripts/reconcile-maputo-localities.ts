import {
  access,
  mkdir,
  readFile,
  writeFile
} from "node:fs/promises";

import path from "node:path";

type MozgisRecord = {
  province: string;
  district: string;
  administrativePost: string;
  locality: string;
  neighborhood: string | null;
};

type MozgisSnapshot = {
  records: MozgisRecord[];
};

type District = {
  id: string;
  name: string;
  slug: string;
  provinceId: string;
};

type AdministrativePost = {
  id: string;
  name: string;
  slug: string;
  districtId: string;
};

type CoverageDistrict = {
  districtId: string;
  district: string;
  localitiesExpected: number;
  status: string;
};

type Coverage = {
  districts: CoverageDistrict[];
};

type Candidate = {
  id: string;
  code: null;
  name: string;
  slug: string;
  type: "LOCALITY";
  administrativePostId: string;
  districtId: null;
};

function normalize(
  value: string
): string {
  return value
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .replace(
      /\bsede\b/g,
      ""
    )
    .replace(
      /[^a-z0-9]+/g,
      " "
    )
    .trim()
    .replace(
      /\s+/g,
      " "
    );
}

function slugify(
  value: string
): string {
  return value
    .normalize("NFKD")
    .replace(
      /[\u0300-\u036f]/g,
      ""
    )
    .toLowerCase()
    .replace(
      /[^a-z0-9]+/g,
      "-"
    )
    .replace(
      /^-+|-+$/g,
      ""
    );
}

async function exists(
  filePath: string
) {
  try {
    await access(filePath);
    return true;
  } catch {
    return false;
  }
}

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

function uniqueBy<T>(
  items: T[],
  getKey: (item: T) => string
): T[] {
  const map =
    new Map<string, T>();

  for (const item of items) {
    map.set(
      getKey(item),
      item
    );
  }

  return [...map.values()];
}

async function main() {
  const root =
    process.cwd();

  const maputoSnapshot =
    path.join(
      root,
      "data",
      "research",
      "mozgis",
      "localities-2017-maputo.json"
    );

  const nationalSnapshot =
    path.join(
      root,
      "data",
      "research",
      "mozgis",
      "localities-2017-mozambique.json"
    );

  const snapshotPath =
    await exists(
      maputoSnapshot
    )
      ? maputoSnapshot
      : nationalSnapshot;

  if (
    !(await exists(
      snapshotPath
    ))
  ) {
    throw new Error(
      "No MozGIS snapshot found. Run `npm run data:research:mozgis` first."
    );
  }

  console.log(
    `📦 Using snapshot: ${snapshotPath}`
  );

  const snapshot =
    await readJson<MozgisSnapshot>(
      snapshotPath
    );

  const districts =
    await readJson<District[]>(
      path.join(
        root,
        "data",
        "current",
        "districts.json"
      )
    );

  const posts =
    await readJson<
      AdministrativePost[]
    >(
      path.join(
        root,
        "data",
        "current",
        "administrative-posts.json"
      )
    );

  const coverage =
    await readJson<Coverage>(
      path.join(
        root,
        "data",
        "coverage",
        "maputo-province.json"
      )
    );

  const targetDistricts =
    coverage.districts.filter(
      (item) =>
        item.localitiesExpected > 0
    );

  const districtById =
    new Map(
      districts.map(
        (district) => [
          district.id,
          district
        ]
      )
    );

  const maputoRecords =
    snapshot.records.filter(
      (record) =>
        normalize(
          record.province
        ).includes(
          "maputo"
        )
    );

  const reportDistricts = [];

  const allCandidates:
    Candidate[] = [];

  for (
    const target of
    targetDistricts
  ) {
    const district =
      districtById.get(
        target.districtId
      );

    if (!district) {
      reportDistricts.push({
        districtId:
          target.districtId,
        district:
          target.district,
        error:
          "District not found in canonical dataset."
      });

      continue;
    }

    const sourceDistrictRecords =
      maputoRecords.filter(
        (record) =>
          normalize(
            record.district
          ) ===
          normalize(
            district.name
          )
      );

    const canonicalPosts =
      posts.filter(
        (post) =>
          post.districtId ===
          district.id
      );

    const sourcePostNames =
      [
        ...new Set(
          sourceDistrictRecords.map(
            (record) =>
              record.administrativePost
          )
        )
      ].sort();

    const postMappings =
      sourcePostNames.map(
        (sourceName) => {
          const matches =
            canonicalPosts.filter(
              (post) =>
                normalize(
                  post.name
                ) ===
                normalize(
                  sourceName
                )
            );

          return {
            sourceName,
            matches
          };
        }
      );

    const unmatchedPosts =
      postMappings
        .filter(
          (mapping) =>
            mapping.matches.length !== 1
        )
        .map(
          (mapping) => ({
            sourceName:
              mapping.sourceName,

            canonicalMatches:
              mapping.matches.map(
                (post) => ({
                  id: post.id,
                  name: post.name
                })
              )
          })
        );

    const localities =
      uniqueBy(
        sourceDistrictRecords,
        (record) =>
          [
            normalize(
              record.administrativePost
            ),
            normalize(
              record.locality
            )
          ].join("|")
      );

    const candidates:
      Candidate[] = [];

    for (const locality of localities) {
      const mapping =
        postMappings.find(
          (item) =>
            normalize(
              item.sourceName
            ) ===
            normalize(
              locality.administrativePost
            )
        );

      if (
        !mapping ||
        mapping.matches.length !== 1
      ) {
        continue;
      }

      const post =
        mapping.matches[0]!;

      const slug =
        slugify(
          locality.locality
        );

      candidates.push({
        id:
          `locality_${slugify(
            district.name
          ).replace(
            /-/g,
            "_"
          )}_${slug.replace(
            /-/g,
            "_"
          )}`,

        code: null,
        name:
          locality.locality,
        slug,
        type: "LOCALITY",
        administrativePostId:
          post.id,
        districtId: null
      });
    }

    const candidateUnique =
      uniqueBy(
        candidates,
        (item) =>
          [
            item.administrativePostId,
            item.slug
          ].join("|")
      );

    allCandidates.push(
      ...candidateUnique
    );

    const exactCountMatch =
      localities.length ===
      target.localitiesExpected;

    const allPostsMapped =
      unmatchedPosts.length === 0;

    reportDistricts.push({
      districtId:
        district.id,

      district:
        district.name,

      expectedLocalities:
        target.localitiesExpected,

      sourceLocalities:
        localities.length,

      exactCountMatch,

      canonicalPosts:
        canonicalPosts.length,

      sourcePosts:
        sourcePostNames.length,

      allPostsMapped,

      unmatchedPosts,

      candidateCount:
        candidateUnique.length,

      promotionReadiness:
        exactCountMatch &&
        allPostsMapped &&
        candidateUnique.length ===
          target.localitiesExpected
          ? "READY_FOR_REVIEW"
          : "NEEDS_RECONCILIATION",

      candidates:
        candidateUnique
    });
  }

  const summary = {
    districtsChecked:
      reportDistricts.length,

    readyForReview:
      reportDistricts.filter(
        (item) =>
          "promotionReadiness" in item &&
          item.promotionReadiness ===
            "READY_FOR_REVIEW"
      ).length,

    needsReconciliation:
      reportDistricts.filter(
        (item) =>
          "promotionReadiness" in item &&
          item.promotionReadiness ===
            "NEEDS_RECONCILIATION"
      ).length,

    candidateLocalities:
      allCandidates.length
  };

  const output = {
    generatedAt:
      new Date()
        .toISOString(),

    sourceSnapshot:
      path.relative(
        root,
        snapshotPath
      ),

    warning:
      "READY_FOR_REVIEW means structural/count agreement with the 2017 MozGIS snapshot and current coverage target. It is not automatic proof that every locality remains current.",

    summary,

    districts:
      reportDistricts
  };

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

  const reportPath =
    path.join(
      outputDir,
      "maputo-mozgis-2017-comparison.json"
    );

  await writeFile(
    reportPath,
    JSON.stringify(
      output,
      null,
      2
    ) + "\n",
    "utf8"
  );

  const candidatePath =
    path.join(
      outputDir,
      "maputo-locality-candidates.json"
    );

  await writeFile(
    candidatePath,
    JSON.stringify(
      allCandidates,
      null,
      2
    ) + "\n",
    "utf8"
  );

  console.log(
    "\n✅ Maputo reconciliation completed."
  );

  console.log(
    `   Districts checked: ${summary.districtsChecked}`
  );

  console.log(
    `   Ready for review: ${summary.readyForReview}`
  );

  console.log(
    `   Needs reconciliation: ${summary.needsReconciliation}`
  );

  console.log(
    `   Candidate localities: ${summary.candidateLocalities}`
  );

  console.log(
    `   Report: ${reportPath}`
  );

  console.log(
    `   Candidates: ${candidatePath}`
  );

  console.log(
    "\nDistrict status:"
  );

  for (
    const item of
    reportDistricts
  ) {
    if (
      !("promotionReadiness" in item)
    ) {
      console.log(
        `   ❌ ${item.district}: ${item.error}`
      );

      continue;
    }

    const mark =
      item.promotionReadiness ===
        "READY_FOR_REVIEW"
        ? "✅"
        : "⚠️";

    console.log(
      `   ${mark} ${item.district}: ${item.sourceLocalities}/${item.expectedLocalities} localities, ${item.promotionReadiness}`
    );
  }
}

await main();
