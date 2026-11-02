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

import packageJson from "../package.json" with {
  type: "json"
};

import {
  buildApp
} from "../src/app.js";

import {
  resolveTrustProxy
} from "../src/config/http-protection.js";

import {
  sumTargets
} from "../src/modules/coverage/coverage.service.js";

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

  it("rejects invalid name evidence", async () => {
    const response =
      await app.inject({
        method: "GET",
        url:
          "/api/v1/localities?nameEvidence=INVALID"
      });

    assert.equal(
      response.statusCode,
      400
    );

    assert.equal(
      response.json().error,
      "INVALID_NAME_EVIDENCE"
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

  it("does not let clients cache errors", async () => {
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
      response.headers["cache-control"],
      undefined
    );
  });

  it("does not let clients cache health checks", async () => {
    const response =
      await app.inject({
        method: "GET",
        url: "/health"
      });

    assert.equal(
      response.headers["cache-control"],
      undefined
    );
  });

  it("GET / reports the package version", async () => {
    const response =
      await app.inject({
        method: "GET",
        url: "/"
      });

    assert.equal(
      response.json().version,
      packageJson.version
    );
  });

  for (
    const route of [
      "/api/v1/provinces",
      "/api/v1/districts",
      "/api/v1/administrative-posts",
      "/api/v1/localities",
      "/api/v1/sources"
    ]
  ) {
    it(`rejects a page beyond the safe integer range on ${route}`, async () => {
      const response =
        await app.inject({
          method: "GET",
          url:
            `${route}?page=99999999999999999999`
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
  }
});

describe("National coverage targets", () => {
  it("adds up the province targets", () => {
    assert.equal(
      sumTargets([2, 3]),
      5
    );
  });

  it("is unknown when a province has no verified target", () => {
    assert.equal(
      sumTargets([2, null]),
      null
    );
  });

  it("is unknown before any coverage has been loaded", () => {
    assert.equal(
      sumTargets([]),
      null
    );
  });
});

describe("OpenAPI document", () => {
  it("describes the API routes", async () => {
    const response =
      await app.inject({
        method: "GET",
        url: "/docs/json"
      });

    assert.equal(
      response.statusCode,
      200
    );

    const paths =
      Object.keys(
        response.json().paths
      );

    for (
      const path of [
        "/",
        "/health",
        "/health/ready",
        "/api/v1/provinces/",
        "/api/v1/districts/",
        "/api/v1/administrative-posts/",
        "/api/v1/localities/",
        "/api/v1/sources/",
        "/api/v1/search/",
        "/api/v1/tree/",
        "/api/v1/coverage/"
      ]
    ) {
      assert.ok(
        paths.includes(path),
        `${path} is missing from ${paths.join(", ")}`
      );
    }
  });

  it("reports the package version", async () => {
    const response =
      await app.inject({
        method: "GET",
        url: "/docs/json"
      });

    assert.equal(
      response.json().info.version,
      packageJson.version
    );
  });
});

describe("Error responses", () => {
  const secret =
    "postgresql://user:secret@db.internal/moz_address";

  async function buildFailingApp(
    error: Error
  ) {
    const failingApp =
      buildApp();

    failingApp.get(
      "/failure",
      async () => {
        throw error;
      }
    );

    await failingApp.ready();

    return failingApp;
  }

  it("hides the details of unexpected errors", async () => {
    const failingApp =
      await buildFailingApp(
        new Error(secret)
      );

    const response =
      await failingApp.inject({
        method: "GET",
        url: "/failure"
      });

    await failingApp.close();

    assert.equal(
      response.statusCode,
      500
    );

    assert.deepEqual(
      response.json(),
      {
        error:
          "INTERNAL_SERVER_ERROR",

        message:
          "An unexpected error occurred."
      }
    );
  });

  it("keeps client errors unchanged", async () => {
    const failingApp =
      await buildFailingApp(
        Object.assign(
          new Error("Conflict detail."),
          {
            statusCode: 409
          }
        )
      );

    const response =
      await failingApp.inject({
        method: "GET",
        url: "/failure"
      });

    await failingApp.close();

    assert.equal(
      response.statusCode,
      409
    );

    assert.equal(
      response.json().message,
      "Conflict detail."
    );
  });
});

describe("Health endpoints", () => {
  it("GET /health/ready returns ok when the database responds", async () => {
    const readyApp =
      buildApp({
        checkDatabase:
          async () => {}
      });

    const response =
      await readyApp.inject({
        method: "GET",
        url: "/health/ready"
      });

    await readyApp.close();

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

  it("GET /health/ready returns 503 without details when the database fails", async () => {
    const unreadyApp =
      buildApp({
        checkDatabase:
          async () => {
            throw new Error(
              "connect ECONNREFUSED db.internal:5432"
            );
          }
      });

    const response =
      await unreadyApp.inject({
        method: "GET",
        url: "/health/ready"
      });

    await unreadyApp.close();

    assert.equal(
      response.statusCode,
      503
    );

    assert.deepEqual(
      response.json(),
      {
        status: "unavailable"
      }
    );
  });

  it("GET /health stays ok when the database fails", async () => {
    const unreadyApp =
      buildApp({
        checkDatabase:
          async () => {
            throw new Error(
              "connect ECONNREFUSED"
            );
          }
      });

    const response =
      await unreadyApp.inject({
        method: "GET",
        url: "/health"
      });

    await unreadyApp.close();

    assert.equal(
      response.statusCode,
      200
    );
  });
});

describe("Rate limiting behind a proxy", () => {
  async function remainingAfterTwoClients(
    proxiedApp: FastifyInstance
  ) {
    const request = (
      clientIp: string
    ) =>
      proxiedApp.inject({
        method: "GET",
        url: "/",

        headers: {
          "x-forwarded-for":
            clientIp
        }
      });

    await request(
      "203.0.113.1"
    );

    const response =
      await request(
        "203.0.113.2"
      );

    return {
      limit:
        Number(
          response.headers[
            "x-ratelimit-limit"
          ]
        ),

      remaining:
        Number(
          response.headers[
            "x-ratelimit-remaining"
          ]
        )
    };
  }

  it("counts each client separately when the proxy is trusted", async () => {
    const proxiedApp =
      buildApp({
        trustProxy: "127.0.0.1"
      });

    const {
      limit,
      remaining
    } =
      await remainingAfterTwoClients(
        proxiedApp
      );

    await proxiedApp.close();

    assert.equal(
      remaining,
      limit - 1
    );
  });

  it("ignores X-Forwarded-For by default", async () => {
    const directApp =
      buildApp();

    const {
      limit,
      remaining
    } =
      await remainingAfterTwoClients(
        directApp
      );

    await directApp.close();

    assert.equal(
      remaining,
      limit - 2
    );
  });

  describe("with a proxy count, as on hosting platforms", () => {
    async function remainingAfter(
      forwardedFor: [string, string]
    ) {
      const proxiedApp =
        buildApp({
          trustProxy:
            resolveTrustProxy("1")
        });

      const request = (
        value: string
      ) =>
        proxiedApp.inject({
          method: "GET",
          url: "/",

          headers: {
            "x-forwarded-for": value
          }
        });

      await request(forwardedFor[0]);

      const response =
        await request(forwardedFor[1]);

      await proxiedApp.close();

      return (
        Number(
          response.headers[
            "x-ratelimit-limit"
          ]
        ) -
        Number(
          response.headers[
            "x-ratelimit-remaining"
          ]
        )
      );
    }

    it("counts different clients separately", async () => {
      assert.equal(
        await remainingAfter([
          "203.0.113.1",
          "203.0.113.2"
        ]),
        1
      );
    });

    it("does not let a client change its address with a forged header", async () => {
      /*
       * The proxy appends the address it really saw, after
       * whatever the client sent.
       */
      assert.equal(
        await remainingAfter([
          "198.51.100.1, 203.0.113.1",
          "198.51.100.2, 203.0.113.1"
        ]),
        2
      );
    });
  });

  it("parses the TRUST_PROXY setting", () => {
    assert.equal(
      resolveTrustProxy("false"),
      false
    );

    assert.equal(
      resolveTrustProxy(""),
      false
    );

    assert.equal(
      resolveTrustProxy("true"),
      true
    );

    assert.equal(
      resolveTrustProxy("10.0.0.0/8,127.0.0.1"),
      "10.0.0.0/8,127.0.0.1"
    );
  });
});
