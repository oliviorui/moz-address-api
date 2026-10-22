import type {
  FastifyInstance
} from "fastify";

import {
  provinceRoutes
} from "../modules/provinces/province.routes.js";

import {
  districtRoutes
} from "../modules/districts/district.routes.js";

import {
  administrativePostRoutes
} from "../modules/administrative-posts/administrative-post.routes.js";

import {
  localityRoutes
} from "../modules/localities/locality.routes.js";

import {
  sourceRoutes
} from "../modules/sources/source.routes.js";

import {
  searchRoutes
} from "../modules/search/search.routes.js";

import {
  treeRoutes
} from "../modules/tree/tree.routes.js";

import {
  coverageRoutes
} from "../modules/coverage/coverage.routes.js";

export async function registerRoutes(
  app: FastifyInstance
) {
  await app.register(
    provinceRoutes,
    {
      prefix: "/provinces"
    }
  );

  await app.register(
    districtRoutes,
    {
      prefix: "/districts"
    }
  );

  await app.register(
    administrativePostRoutes,
    {
      prefix:
        "/administrative-posts"
    }
  );

  await app.register(
    localityRoutes,
    {
      prefix: "/localities"
    }
  );

  await app.register(
    sourceRoutes,
    {
      prefix: "/sources"
    }
  );

  await app.register(
    searchRoutes,
    {
      prefix: "/search"
    }
  );

  await app.register(
    treeRoutes,
    {
      prefix: "/tree"
    }
  );

  await app.register(
    coverageRoutes,
    {
      prefix: "/coverage"
    }
  );
}
