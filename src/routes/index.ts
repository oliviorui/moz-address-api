import type { FastifyInstance } from "fastify";

import { provinceRoutes } from "../modules/provinces/province.routes.js";
import { sourceRoutes } from "../modules/sources/source.routes.js";

export async function registerRoutes(
  app: FastifyInstance
) {
  await app.register(provinceRoutes, {
    prefix: "/provinces"
  });

  await app.register(sourceRoutes, {
    prefix: "/sources"
  });
}
