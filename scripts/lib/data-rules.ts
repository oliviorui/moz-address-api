export type NameEvidence =
  | "CURRENT_SOURCE"
  | "HISTORICAL_SOURCE_COUNT_CONFIRMED"
  | "HISTORICAL_SOURCE_ONLY";

export type ReferenceSupport = {
  sourceId: string;
  supports: "NAME" | "COUNT";
};

export type CoverageLayer =
  | "administrativePosts"
  | "localities"
  | "neighborhoods";

export type CoverageBlocker = {
  code: string;
  layer: CoverageLayer;
  districts: string[];
  missing: number | null;
  note: string;
};

type DistrictLayer =
  | "localities"
  | "neighborhoods";

export type DistrictCoverage = {
  districtId: string;
  district: string;
  expected: Record<DistrictLayer, number | null>;
};

export type ProvinceCoverage = {
  provinceId: string;
  province: string;
  status: "COMPLETE" | "PARTIAL";
  sourceIds: string[];
  expected: Record<CoverageLayer, number | null>;
  blockers: CoverageBlocker[];
  notes: string[];
  districts?: DistrictCoverage[];
};

const LAYERS: CoverageLayer[] = [
  "administrativePosts",
  "localities",
  "neighborhoods"
];

const LAYER_LABELS: Record<CoverageLayer, string> = {
  administrativePosts: "administrative posts",
  localities: "localities",
  neighborhoods: "neighborhoods"
};

/*
 * A count only shows that the number of records
 * matches. It says nothing about the names, so a
 * name is current only if a current source lists it.
 */
export function deriveNameEvidence(
  references: ReferenceSupport[],
  sources: Map<string, { isHistorical: boolean }>
): NameEvidence | null {
  const isCurrent = (reference: ReferenceSupport) =>
    sources.get(reference.sourceId)?.isHistorical === false;

  const names = references.filter(
    (reference) => reference.supports === "NAME"
  );

  if (names.length === 0) {
    return null;
  }

  if (names.some(isCurrent)) {
    return "CURRENT_SOURCE";
  }

  return references.some(
    (reference) =>
      reference.supports === "COUNT" &&
      isCurrent(reference)
  )
    ? "HISTORICAL_SOURCE_COUNT_CONFIRMED"
    : "HISTORICAL_SOURCE_ONLY";
}

/*
 * District targets stop a surplus in one district
 * from hiding a gap in another. A null target means
 * the district has no verified figure for that layer.
 */
export function checkDistrictCoverage(
  coverage: ProvinceCoverage,
  loaded: Map<string, Record<DistrictLayer, number>>
): string[] {
  const errors: string[] = [];

  for (const district of coverage.districts ?? []) {
    for (
      const layer of [
        "localities",
        "neighborhoods"
      ] as const
    ) {
      const expected = district.expected[layer];
      const actual =
        loaded.get(district.districtId)?.[layer] ?? 0;

      const isBlocked = coverage.blockers.some(
        (blocker) =>
          blocker.layer === layer &&
          blocker.districts.includes(district.district)
      );

      if (
        expected !== null &&
        actual !== expected &&
        !isBlocked
      ) {
        errors.push(
          `${coverage.province} / ${district.district}: expected ${expected} ${layer}, found ${actual}.`
        );
      }
    }
  }

  return errors;
}

/*
 * Every known gap must be explained by blockers.
 * This is the rule that keeps coverage files honest:
 * an unexplained difference fails validation.
 */
export function checkProvinceCoverage(
  coverage: ProvinceCoverage,
  loaded: Record<CoverageLayer, number>
): string[] {
  const errors: string[] = [];
  let hasGap = false;

  for (const layer of LAYERS) {
    const label = LAYER_LABELS[layer];
    const expected = coverage.expected[layer];
    const blockers = coverage.blockers.filter(
      (blocker) => blocker.layer === layer
    );

    if (expected === null) {
      hasGap = true;

      if (blockers.length === 0) {
        errors.push(
          `${coverage.province}: ${label} have no verified target and no blocker explaining why.`
        );
      }

      continue;
    }

    const missing = Math.max(expected - loaded[layer], 0);
    hasGap = hasGap || missing > 0;

    if (loaded[layer] > expected) {
      errors.push(
        `${coverage.province}: ${loaded[layer]} ${label} loaded, more than the target of ${expected}.`
      );
    }

    if (
      coverage.status === "COMPLETE" &&
      missing > 0
    ) {
      errors.push(
        `${coverage.province} is COMPLETE but has ${missing} missing ${label}.`
      );

      continue;
    }

    const explained = blockers.reduce(
      (total, blocker) => total + (blocker.missing ?? 0),
      0
    );

    if (
      coverage.status === "PARTIAL" &&
      explained !== missing
    ) {
      errors.push(
        `${coverage.province}: ${missing} missing ${label} but blockers explain ${explained}.`
      );
    }
  }

  if (
    coverage.status === "PARTIAL" &&
    !hasGap
  ) {
    errors.push(
      `${coverage.province} is PARTIAL but has no gaps.`
    );
  }

  return errors;
}
