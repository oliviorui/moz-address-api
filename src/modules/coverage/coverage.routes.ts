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
          "Shows which administrative levels and verified areas are complete, partial or still have an unknown national target.",

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
