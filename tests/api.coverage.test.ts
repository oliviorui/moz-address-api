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
});
