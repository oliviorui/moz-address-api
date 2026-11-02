import assert from "node:assert/strict";
import {
  describe,
  it
} from "node:test";

import {
  checkDistrictCoverage,
  checkProvinceCoverage,
  deriveNameEvidence,
  type ProvinceCoverage
} from "../scripts/lib/data-rules.js";

const sources = new Map([
  ["current", { isHistorical: false }],
  ["old", { isHistorical: true }]
]);

describe("deriveNameEvidence", () => {
  it("prefers a current source that lists the name", () => {
    assert.equal(
      deriveNameEvidence(
        [
          { sourceId: "old", supports: "NAME" },
          { sourceId: "current", supports: "NAME" }
        ],
        sources
      ),
      "CURRENT_SOURCE"
    );
  });

  it("flags a historical name with a current count", () => {
    assert.equal(
      deriveNameEvidence(
        [
          { sourceId: "old", supports: "NAME" },
          { sourceId: "current", supports: "COUNT" }
        ],
        sources
      ),
      "HISTORICAL_SOURCE_COUNT_CONFIRMED"
    );
  });

  it("flags a historical name with no current confirmation", () => {
    assert.equal(
      deriveNameEvidence(
        [
          { sourceId: "old", supports: "NAME" }
        ],
        sources
      ),
      "HISTORICAL_SOURCE_ONLY"
    );
  });

  it("does not treat a count from a historical source as confirmation", () => {
    assert.equal(
      deriveNameEvidence(
        [
          { sourceId: "old", supports: "NAME" },
          { sourceId: "old", supports: "COUNT" }
        ],
        sources
      ),
      "HISTORICAL_SOURCE_ONLY"
    );
  });

  it("returns null when no source supports the name", () => {
    assert.equal(
      deriveNameEvidence(
        [
          { sourceId: "current", supports: "COUNT" }
        ],
        sources
      ),
      null
    );
  });
});

describe("checkDistrictCoverage", () => {
  const coverage: ProvinceCoverage = {
    provinceId: "prov_x",
    province: "Test",
    status: "PARTIAL",
    sourceIds: [],
    expected: {
      administrativePosts: 0,
      localities: 10,
      neighborhoods: 0
    },
    blockers: [
      {
        code: "X",
        layer: "localities",
        districts: ["Blocked"],
        missing: 4,
        note: "Reason."
      }
    ],
    notes: [],
    districts: [
      {
        districtId: "d1",
        district: "Blocked",
        expected: {
          localities: 4,
          neighborhoods: 0
        }
      },
      {
        districtId: "d2",
        district: "Other",
        expected: {
          localities: 6,
          neighborhoods: null
        }
      }
    ]
  };

  it("accepts a gap in a district named by a blocker", () => {
    assert.deepEqual(
      checkDistrictCoverage(
        coverage,
        new Map([
          ["d2", { localities: 6, neighborhoods: 3 }]
        ])
      ),
      []
    );
  });

  it("rejects a difference in a district no blocker names", () => {
    const errors =
      checkDistrictCoverage(
        coverage,
        new Map([
          ["d2", { localities: 5, neighborhoods: 0 }]
        ])
      );

    assert.equal(
      errors.length,
      1
    );

    assert.match(
      errors[0] ?? "",
      /Other: expected 6 localities, found 5/
    );
  });
});

describe("checkProvinceCoverage", () => {
  const complete: ProvinceCoverage = {
    provinceId: "prov_x",
    province: "Test",
    status: "COMPLETE",
    sourceIds: ["current"],
    expected: {
      administrativePosts: 2,
      localities: 10,
      neighborhoods: 5
    },
    blockers: [],
    notes: []
  };

  const loaded = {
    administrativePosts: 2,
    localities: 10,
    neighborhoods: 5
  };

  it("accepts a complete province that matches its targets", () => {
    assert.deepEqual(
      checkProvinceCoverage(
        complete,
        loaded
      ),
      []
    );
  });

  it("rejects a COMPLETE province with missing records", () => {
    const errors =
      checkProvinceCoverage(
        complete,
        {
          ...loaded,
          localities: 9
        }
      );

    assert.equal(
      errors.length,
      1
    );

    assert.match(
      errors[0] ?? "",
      /localities/
    );
  });

  it("accepts a partial province whose gap is fully documented", () => {
    assert.deepEqual(
      checkProvinceCoverage(
        {
          ...complete,
          status: "PARTIAL",
          blockers: [
            {
              code: "X",
              layer: "localities",
              districts: ["A"],
              missing: 3,
              note: "Reason."
            },
            {
              code: "X",
              layer: "localities",
              districts: ["B"],
              missing: 1,
              note: "Reason."
            }
          ]
        },
        {
          ...loaded,
          localities: 6
        }
      ),
      []
    );
  });

  it("rejects a partial province with an undocumented gap", () => {
    const errors =
      checkProvinceCoverage(
        {
          ...complete,
          status: "PARTIAL",
          blockers: [
            {
              code: "X",
              layer: "localities",
              districts: ["A"],
              missing: 3,
              note: "Reason."
            }
          ]
        },
        {
          ...loaded,
          localities: 6
        }
      );

    assert.equal(
      errors.length,
      1
    );

    assert.match(
      errors[0] ?? "",
      /4 missing localities but blockers explain 3/
    );
  });

  it("rejects a PARTIAL province with no gaps", () => {
    assert.equal(
      checkProvinceCoverage(
        {
          ...complete,
          status: "PARTIAL"
        },
        loaded
      ).length,
      1
    );
  });

  it("requires a blocker for a layer with no verified target", () => {
    const coverage: ProvinceCoverage = {
      ...complete,
      status: "PARTIAL",
      expected: {
        ...complete.expected,
        neighborhoods: null
      }
    };

    assert.equal(
      checkProvinceCoverage(
        coverage,
        loaded
      ).length,
      1
    );

    assert.deepEqual(
      checkProvinceCoverage(
        {
          ...coverage,
          blockers: [
            {
              code: "X",
              layer: "neighborhoods",
              districts: [],
              missing: null,
              note: "No verified list."
            }
          ]
        },
        loaded
      ),
      []
    );
  });

  it("rejects a blocker with an unknown count while the target is known", () => {
    assert.equal(
      checkProvinceCoverage(
        {
          ...complete,
          status: "PARTIAL",
          blockers: [
            {
              code: "X",
              layer: "localities",
              districts: ["A"],
              missing: null,
              note: "Reason."
            }
          ]
        },
        {
          ...loaded,
          localities: 9
        }
      ).length,
      1
    );
  });
});
