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

let app: FastifyInstance;

before(async () => {
  app = buildApp();

  await app.ready();
});

after(async () => {
  await app.close();
});

describe("API smoke tests", () => {
  it("GET / returns API metadata", async () => {
    const response =
      await app.inject({
        method: "GET",
        url: "/"
      });

    assert.equal(
      response.statusCode,
      200
    );

    const body =
      response.json();

    assert.equal(
      body.name,
      "moz-address-api"
    );

    assert.equal(
      body.status,
      "ok"
    );
  });

  it("GET /health returns ok", async () => {
    const response =
      await app.inject({
        method: "GET",
        url: "/health"
      });

    assert.equal(
      response.statusCode,
      200
    );

    assert.deepEqual(
      response.json(),
      {
        status: "ok"
      }
    );
  });

  it("adds CORS headers for browser requests", async () => {
    const response =
      await app.inject({
        method: "GET",
        url: "/health",

        headers: {
          origin:
            "https://example.com"
        }
      });

    assert.equal(
      response.statusCode,
      200
    );

    assert.equal(
      response.headers[
        "access-control-allow-origin"
      ],
      "https://example.com"
    );
  });

  it("supports CORS preflight requests", async () => {
    const response =
      await app.inject({
        method: "OPTIONS",
        url:
          "/api/v1/provinces",

        headers: {
          origin:
            "https://example.com",

          "access-control-request-method":
            "GET"
        }
      });

    assert.equal(
      response.statusCode,
      204
    );

    assert.equal(
      response.headers[
        "access-control-allow-origin"
      ],
      "https://example.com"
    );
  });

  it("rejects invalid province page", async () => {
    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/provinces?page=0"
      });

    assert.equal(
      response.statusCode,
      400
    );

    assert.equal(
      response.json().error,
      "INVALID_PAGE"
    );
  });

  it("rejects invalid district type", async () => {
    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/districts?type=INVALID"
      });

    assert.equal(
      response.statusCode,
      400
    );

    assert.equal(
      response.json().error,
      "INVALID_DISTRICT_TYPE"
    );
  });

  it("rejects invalid administrative-post limit", async () => {
    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/administrative-posts?limit=0"
      });

    assert.equal(
      response.statusCode,
      400
    );

    assert.equal(
      response.json().error,
      "INVALID_LIMIT"
    );
  });

  it("rejects invalid locality type", async () => {
    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/localities?type=INVALID"
      });

    assert.equal(
      response.statusCode,
      400
    );

    assert.equal(
      response.json().error,
      "INVALID_LOCALITY_TYPE"
    );
  });

  it("rejects invalid source year", async () => {
    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/sources?year=abc"
      });

    assert.equal(
      response.statusCode,
      400
    );

    assert.equal(
      response.json().error,
      "INVALID_SOURCE_YEAR"
    );
  });
});
