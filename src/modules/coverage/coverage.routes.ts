import type {
  FastifyInstance
} from "fastify";

import {
  getDataCoverage
} from "./coverage.service.js";

export async function coverageRoutes(
  app: FastifyInstance
) {
  app.get(
    "/",
    {
      schema: {
        tags: ["Coverage"],

        summary:
          "Get dataset coverage",

        description:
          "Shows, nationally and for each province, how many records are loaded against the verified targets, why any records are missing, and whether names come from a current source or a historical one.",

        response: {
          200: {
            type: "object",
            additionalProperties: true
          }
        }
      }
    },
    async () => {
      const coverage =
        await getDataCoverage();

      return {
        data: coverage
      };
    }
  );
}
