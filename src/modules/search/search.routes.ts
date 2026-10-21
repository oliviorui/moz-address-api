import type {
  FastifyInstance
} from "fastify";

import {
  globalSearch
} from "./search.service.js";

type SearchQuerystring = {
  q?: string;
  limit?: string;
};

export async function searchRoutes(
  app: FastifyInstance
) {
  app.get<{
    Querystring: SearchQuerystring;
  }>(
    "/",
    {
      schema: {
        tags: ["Search"],

        summary:
          "Search administrative divisions",

        description:
          "Searches provinces, districts, administrative posts, localities and neighborhoods at once.",

        querystring: {
          type: "object",

          properties: {
            q: {
              type: "string",
              minLength: 2,

              description:
                "Search text. Minimum 2 characters.",

              examples: [
                "maputo"
              ]
            },

            limit: {
              type: "string",

              description:
                "Maximum results per category. Must be between 1 and 50.",

              examples: [
                "10"
              ]
            }
          },

          required: ["q"]
        },

        response: {
          200: {
            type: "object",
            additionalProperties: true
          },

          400: {
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
      const query =
        request.query.q?.trim() ?? "";

      if (query.length < 2) {
        return reply
          .status(400)
          .send({
            error:
              "INVALID_SEARCH_QUERY",

            message:
              "Search query must contain at least 2 characters."
          });
      }

      const limit =
        request.query.limit !== undefined
          ? Number(request.query.limit)
          : 10;

      if (
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 50
      ) {
        return reply
          .status(400)
          .send({
            error:
              "INVALID_SEARCH_LIMIT",

            message:
              "Limit must be an integer between 1 and 50."
          });
      }

      const result =
        await globalSearch({
          q: query,
          limit
        });

      return {
        data:
          result.results,

        meta: {
          query:
            result.query,

          limit:
            result.limit,

          total:
            result.total,

          counts: {
            provinces:
              result.results
                .provinces.length,

            districts:
              result.results
                .districts.length,

            administrativePosts:
              result.results
                .administrativePosts
                .length,

            localities:
              result.results
                .localities.length
          }
        }
      };
    }
  );
}
