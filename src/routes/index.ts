import type { FastifyInstance } from "fastify";

import { provinceRoutes } from "../modules/provinces/province.routes.js";

export async function registerRoutes(
  app: FastifyInstance
) {
  await app.register(provinceRoutes, {
    prefix: "/provinces"
  });
}
