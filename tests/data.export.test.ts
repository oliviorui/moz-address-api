import assert from "node:assert/strict";
import {
  describe,
  it
} from "node:test";

import {
  buildExport,
  toCsv,
  type ExportInput
} from "../scripts/lib/export-data.js";

const input: ExportInput = {
  provinces: [
    {
      id: "prov_1",
      name: "Província",
      slug: "provincia",
      type: "province",
      capital: "Capital"
    }
  ],
  districts: [
    {
      id: "dist_1",
      name: "Distrito",
      slug: "distrito",
      provinceId: "prov_1"
    },
    {
      id: "dist_2",
      name: "Urbano",
      slug: "urbano",
      provinceId: "prov_1",
      type: "MUNICIPAL_DISTRICT"
    }
  ],
  administrativePosts: [
    {
      id: "post_1",
      name: "Posto",
      slug: "posto",
      districtId: "dist_1"
    }
  ],
  localities: [
    {
      id: "loc_1",
      name: "Localidade",
      slug: "localidade",
      type: "LOCALITY",
      nameEvidence: "CURRENT_SOURCE",
      administrativePostId: "post_1",
      districtId: null
    },
    {
      id: "nb_1",
      name: "Bairro",
      slug: "bairro",
      type: "NEIGHBORHOOD",
      nameEvidence: "HISTORICAL_SOURCE_COUNT_CONFIRMED",
      administrativePostId: null,
      districtId: "dist_2"
    }
  ],
  localitySources: [
    {
      localityId: "loc_1",
      sourceId: "src_1",
      supports: "NAME",
      page: null,
      notes: "Listed."
    }
  ],
  sources: [
    {
      id: "src_1",
      institution: "INE",
      title: "Anuário",
      type: "OFFICIAL",
      isHistorical: false,
      year: 2024,
      url: null,
      accessedAt: null,
      notes: null
    }
  ],
  coverage: [
    {
      provinceId: "prov_1",
      province: "Província",
      status: "PARTIAL",
      sourceIds: ["src_1"],
      expected: {
        administrativePosts: 1,
        localities: 3,
        neighborhoods: null
      },
      blockers: [],
      notes: []
    }
  ]
};

function rowsOf(csv: string | undefined) {
  const [header, ...rows] =
    (csv ?? "").trimEnd().split("\n");

  const columns =
    (header ?? "").split(",");

  return rows.map((row) =>
    Object.fromEntries(
      row
        .split(",")
        .map((value, index) => [
          columns[index],
          value
        ])
    )
  );
}

describe("toCsv", () => {
  it("quotes only the values that need it", () => {
    assert.equal(
      toCsv(
        ["a", "b", "c", "d"],
        [
          {
            a: "plain",
            b: "has,comma",
            c: 'has "quote"',
            d: "two\nlines"
          }
        ]
      ),
      'a,b,c,d\nplain,"has,comma","has ""quote""","two\nlines"\n'
    );
  });

  it("writes null and missing values as empty cells", () => {
    assert.equal(
      toCsv(
        ["a", "b", "c"],
        [
          {
            a: null,
            c: 0
          }
        ]
      ),
      "a,b,c\n,,0\n"
    );
  });

  it("keeps accents as they are", () => {
    assert.equal(
      toCsv(["a"], [{ a: "Chókwè" }]),
      "a\nChókwè\n"
    );
  });
});

describe("buildExport", () => {
  const files = buildExport(input);

  it("writes each dataset as JSON and CSV", () => {
    for (
      const name of [
        "provinces",
        "districts",
        "administrative-posts",
        "localities",
        "locality-sources",
        "sources",
        "coverage"
      ]
    ) {
      assert.ok(files.has(`${name}.json`), `${name}.json`);
      assert.ok(files.has(`${name}.csv`), `${name}.csv`);
    }
  });

  it("resolves the full hierarchy of a locality under a post", () => {
    const [locality] =
      rowsOf(files.get("localities.csv"));

    assert.equal(locality?.province_id, "prov_1");
    assert.equal(locality?.province, "Província");
    assert.equal(locality?.district_id, "dist_1");
    assert.equal(locality?.district, "Distrito");
    assert.equal(locality?.administrative_post_id, "post_1");
    assert.equal(locality?.administrative_post, "Posto");
    assert.equal(locality?.name_evidence, "CURRENT_SOURCE");
  });

  it("resolves the hierarchy of a neighborhood attached to a district", () => {
    const neighborhood =
      rowsOf(files.get("localities.csv"))[1];

    assert.equal(neighborhood?.province, "Província");
    assert.equal(neighborhood?.district_id, "dist_2");
    assert.equal(neighborhood?.district, "Urbano");
    assert.equal(neighborhood?.administrative_post_id, "");
    assert.equal(neighborhood?.administrative_post, "");
  });

  it("defaults a district with no type to DISTRICT", () => {
    const [district] =
      rowsOf(files.get("districts.csv"));

    assert.equal(district?.type, "DISTRICT");
  });

  it("computes loaded and missing counts in the coverage files", () => {
    const [province] =
      rowsOf(files.get("coverage.csv"));

    assert.equal(province?.localities_loaded, "1");
    assert.equal(province?.localities_expected, "3");
    assert.equal(province?.localities_missing, "2");
    assert.equal(province?.neighborhoods_loaded, "1");
    assert.equal(province?.neighborhoods_expected, "");
    assert.equal(province?.neighborhoods_missing, "");
    assert.equal(province?.status, "PARTIAL");
  });

  it("keeps blockers in the coverage JSON", () => {
    const [province] =
      JSON.parse(
        files.get("coverage.json") ?? "[]"
      );

    assert.deepEqual(province.blockers, []);
    assert.equal(province.localities.missing, 2);
  });

  it("explains how far to trust a name in the bundled README", () => {
    assert.match(
      files.get("README.md") ?? "",
      /HISTORICAL_SOURCE_COUNT_CONFIRMED/
    );
  });
});
