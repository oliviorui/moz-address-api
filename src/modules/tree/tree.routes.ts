import type {
  FastifyInstance
} from "fastify";

import {
  getAdministrativeTree
} from "./tree.service.js";

type TreeQuerystring = {
  province?: string;
};

export async function treeRoutes(
  app: FastifyInstance
) {
  app.get<{
    Querystring: TreeQuerystring;
  }>(
    "/",
    {
      schema: {
        tags: ["Tree"],

        summary:
          "Get administrative hierarchy",

        description:
          "Returns Mozambique's administrative hierarchy. Ordinary provinces follow province → district → administrative post → locality. Maputo City follows capital city → municipal district → neighborhood.",

        querystring: {
          type: "object",

          properties: {
            province: {
              type: "string",

              description:
                "Optional province ID or slug. Omit to return the complete hierarchy.",

              examples: [
                "cidade-de-maputo"
              ]
            }
          }
        },

        response: {
          200: {
            type: "object",
            additionalProperties: true
          },

          404: {
            type: "object",

            properties: {
              error: {
                type: "string"
              },

              message: {
                type: "string"
              }
            },

            required: [
              "error",
              "message"
            ]
          }
        }
      }
    },
    async (request, reply) => {
      const province =
        request.query.province
          ?.trim();

      const result =
        await getAdministrativeTree({
          ...(province
            ? { province }
            : {})
        });

      if (
        province &&
        result.data.length === 0
      ) {
        return reply
          .status(404)
          .send({
            error:
              "PROVINCE_NOT_FOUND",

            message:
              "Province not found."
          });
      }

      return {
        data: result.data,

        meta: {
          province:
            province ?? null,

          counts:
            result.counts
        }
      };
    }
  );
}
