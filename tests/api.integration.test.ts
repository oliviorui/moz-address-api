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

describe("API integration tests", () => {
  it("returns the 11 provinces/equivalents", async () => {
    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/provinces?limit=100"
      });

    assert.equal(
      response.statusCode,
      200
    );

    const body =
      response.json();

    assert.equal(
      body.meta.pagination.total,
      11
    );

    assert.equal(
      body.data.length,
      11
    );
  });

  it("returns the 161 districts/equivalents", async () => {
    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/districts?limit=100"
      });

    assert.equal(
      response.statusCode,
      200
    );

    const body =
      response.json();

    assert.equal(
      body.meta.pagination.total,
      161
    );
  });

  it("returns the 387 loaded administrative posts", async () => {
    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/administrative-posts?limit=1"
      });

    assert.equal(
      response.statusCode,
      200
    );

    const body =
      response.json();

    assert.equal(
      body.meta.pagination.total,
      387
    );
  });

  it("returns the 63 Maputo City neighborhoods", async () => {
    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/localities?type=NEIGHBORHOOD&limit=100"
      });

    assert.equal(
      response.statusCode,
      200
    );

    const body =
      response.json();

    assert.equal(
      body.meta.pagination.total,
      63
    );

    assert.equal(
      body.data.length,
      63
    );
  });

  it("returns the 11 KaMpfumu neighborhoods", async () => {
    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/districts/kampfumu/neighborhoods"
      });

    assert.equal(
      response.statusCode,
      200
    );

    const body =
      response.json();

    assert.equal(
      body.meta.total,
      11
    );

    assert.equal(
      body.meta.district.slug,
      "kampfumu"
    );

    assert.ok(
      body.data.some(
        (item: {
          slug: string;
        }) =>
          item.slug ===
          "central-a"
      )
    );
  });

  it("returns Zimpeto inside KaMubukwana", async () => {
    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/districts/kamubukwana/neighborhoods/zimpeto"
      });

    assert.equal(
      response.statusCode,
      200
    );

    const body =
      response.json();

    assert.equal(
      body.data.name,
      "Zimpeto"
    );

    assert.equal(
      body.data.slug,
      "zimpeto"
    );

    assert.equal(
      body.data.type,
      "NEIGHBORHOOD"
    );
  });

  it("returns 7 municipal districts for Maputo City", async () => {
    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/provinces/cidade-de-maputo/districts"
      });

    assert.equal(
      response.statusCode,
      200
    );

    const body =
      response.json();

    assert.equal(
      body.meta.total,
      7
    );

    assert.equal(
      body.data.length,
      7
    );

    assert.ok(
      body.data.every(
        (item: {
          type: string;
        }) =>
          item.type ===
          "MUNICIPAL_DISTRICT"
      )
    );
  });

  it("rejects neighborhood layer for a normal district", async () => {
    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/districts/boane/neighborhoods"
      });

    assert.equal(
      response.statusCode,
      400
    );

    assert.equal(
      response.json().error,
      "DISTRICT_HAS_NO_NEIGHBORHOOD_LAYER"
    );
  });

  it("returns Maputo City as a municipal tree", async () => {
    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/tree?province=cidade-de-maputo"
      });

    assert.equal(
      response.statusCode,
      200
    );

    const body =
      response.json();

    assert.equal(
      body.data.length,
      1
    );

    assert.equal(
      body.meta.counts.provinces,
      1
    );

    assert.equal(
      body.meta.counts.districts,
      7
    );

    assert.equal(
      body.meta.counts.administrativePosts,
      0
    );

    assert.equal(
      body.meta.counts.neighborhoods,
      63
    );

    assert.ok(
      body.data[0].districts.every(
        (district: {
          type: string;
          administrativePosts:
            unknown[];
        }) =>
          district.type ===
            "MUNICIPAL_DISTRICT" &&
          district
            .administrativePosts
            .length === 0
      )
    );
  });

  it("returns 404 for an unknown tree province", async () => {
    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/tree?province=does-not-exist"
      });

    assert.equal(
      response.statusCode,
      404
    );

    assert.equal(
      response.json().error,
      "PROVINCE_NOT_FOUND"
    );
  });
});
