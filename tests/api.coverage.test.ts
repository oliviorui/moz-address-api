import assert from "node:assert/strict";
import {
  after,
  before,
  describe,
  it
} from "node:test";

import type {
  FastifyInstance
} from "fastify";

import {
  buildApp
} from "../src/app.js";

import {
  closeDatabase
} from "../src/lib/prisma.js";

let app: FastifyInstance;

before(async () => {
  app = buildApp();
  await app.ready();
});

after(async () => {
  await app.close();
  await closeDatabase();
});

describe("Dataset coverage", () => {
  it("reports verified coverage targets", async () => {
    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/coverage"
      });

    assert.equal(
      response.statusCode,
      200
    );

    const body =
      response.json();

    assert.equal(
      body.data.national.provinces.loaded,
      11
    );

    assert.equal(
      body.data.national.provinces.status,
      "COMPLETE"
    );

    assert.equal(
      body.data.national.districts.loaded,
      161
    );

    assert.equal(
      body.data.areas.maputoCity.neighborhoods.loaded,
      63
    );

    assert.equal(
      body.data.areas.matola.neighborhoods.loaded,
      42
    );

    assert.equal(
      body.data.areas.maputoProvince.localities.expected,
      76
    );

    const expected =
      body.data.areas.maputoProvince.districts
        .reduce(
          (
            total: number,
            district: {
              localities: {
                expected: number;
              };
            }
          ) =>
            total +
            district.localities.expected,
          0
        );

    assert.equal(
      expected,
      76
    );
  });

  async function getCoverage() {
    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/coverage"
      });

    assert.equal(
      response.statusCode,
      200
    );

    return response.json().data;
  }

  it("reports all 11 provinces", async () => {
    const coverage =
      await getCoverage();

    assert.equal(
      coverage.provinces.length,
      11
    );
  });

  it("reports a partial province with its known gaps", async () => {
    const coverage =
      await getCoverage();

    const zambezia =
      coverage.provinces.find(
        (province: { slug: string }) =>
          province.slug === "zambezia"
      );

    assert.equal(
      zambezia.status,
      "PARTIAL"
    );

    assert.deepEqual(
      zambezia.localities,
      {
        loaded: 150,
        expected: 191,
        missing: 41,
        percentage: 78.5,
        status: "PARTIAL"
      }
    );

    assert.equal(
      zambezia.neighborhoods.missing,
      128
    );

    assert.ok(
      zambezia.blockers.some(
        (blocker: { districts: string[] }) =>
          blocker.districts.includes("Namacurra")
      )
    );
  });

  it("marks Nampula as partial because of Nacala", async () => {
    const coverage =
      await getCoverage();

    const nampula =
      coverage.provinces.find(
        (province: { slug: string }) =>
          province.slug === "nampula"
      );

    assert.equal(
      nampula.status,
      "PARTIAL"
    );

    assert.equal(
      nampula.neighborhoods.missing,
      41
    );
  });

  it("leaves a layer unknown when its target is not verified", async () => {
    const coverage =
      await getCoverage();

    const caboDelgado =
      coverage.provinces.find(
        (province: { slug: string }) =>
          province.slug === "cabo-delgado"
      );

    assert.equal(
      caboDelgado.neighborhoods.expected,
      null
    );

    assert.equal(
      caboDelgado.neighborhoods.status,
      "UNKNOWN"
    );

    assert.equal(
      coverage.national.neighborhoods.expected,
      null
    );
  });

  it("sums national targets when every province has one", async () => {
    const coverage =
      await getCoverage();

    assert.equal(
      coverage.national.administrativePosts.expected,
      443
    );

    assert.equal(
      coverage.national.localities.expected,
      1168
    );

    assert.equal(
      coverage.national.localities.missing,
      88
    );
  });

  it("reports how each name is supported", async () => {
    const coverage =
      await getCoverage();

    assert.deepEqual(
      coverage.national.nameEvidence,
      {
        currentSource: 208,
        historicalSourceCountConfirmed: 1186,
        historicalSourceOnly: 0
      }
    );

    const maputoCity =
      coverage.provinces.find(
        (province: { slug: string }) =>
          province.slug === "cidade-de-maputo"
      );

    assert.equal(
      maputoCity.nameEvidence.currentSource,
      63
    );

    const zambezia =
      coverage.provinces.find(
        (province: { slug: string }) =>
          province.slug === "zambezia"
      );

    assert.equal(
      zambezia.nameEvidence.historicalSourceCountConfirmed,
      150
    );
  });

  it("does not report settled issues as open", async () => {
    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/coverage"
      });

    assert.doesNotMatch(
      response.body,
      /remains unresolved|being verified district by district/
    );
  });
});

describe("Record evidence", () => {
  it("filters localities by name evidence", async () => {
    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/localities?nameEvidence=current_source&limit=1"
      });

    assert.equal(
      response.statusCode,
      200
    );

    const body =
      response.json();

    assert.equal(
      body.meta.pagination.total,
      208
    );

    assert.equal(
      body.data[0].nameEvidence,
      "CURRENT_SOURCE"
    );
  });

  it("shows what each source supports without a false review date", async () => {
    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/localities/locality_gaza_mapai_mapai_sede_16_de_junho"
      });

    assert.equal(
      response.statusCode,
      200
    );

    const locality =
      response.json().data;

    assert.equal(
      locality.nameEvidence,
      "HISTORICAL_SOURCE_COUNT_CONFIRMED"
    );

    const bySource =
      new Map(
        locality.sources.map(
          (reference: {
            sourceId: string;
          }) => [
            reference.sourceId,
            reference
          ]
        )
      ) as Map<
        string,
        {
          supports: string;
          verifiedAt: string | null;
          source: {
            isHistorical: boolean;
          };
        }
      >;

    const historical =
      bySource.get(
        "ine-mozgis-localities-2017"
      );

    assert.equal(
      historical?.supports,
      "NAME"
    );

    assert.equal(
      historical?.source.isHistorical,
      true
    );

    assert.equal(
      historical?.verifiedAt,
      null
    );

    assert.equal(
      bySource.get(
        "ine-gaza-province-yearbook-2024"
      )?.supports,
      "COUNT"
    );
  });
});
