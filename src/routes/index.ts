import type { FastifyInstance } from "fastify";

import { provinceRoutes } from "../modules/provinces/province.routes.js";
import { districtRoutes } from "../modules/districts/district.routes.js";
import { sourceRoutes } from "../modules/sources/source.routes.js";

export async function registerRoutes(
  app: FastifyInstance
) {
  await app.register(provinceRoutes, {
    prefix: "/provinces"
  });

  await app.register(districtRoutes, {
    prefix: "/districts"
  });

  await app.register(sourceRoutes, {
    prefix: "/sources"
  });
}
