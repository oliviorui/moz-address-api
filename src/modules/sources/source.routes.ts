import type {
  FastifyInstance
} from "fastify";

import {
  SourceType
} from "../../generated/prisma/client.js";

import {
  getAllSources,
  getSourceById
} from "./source.service.js";

type SourceQuerystring = {
  q?: string;
  type?: string;
  institution?: string;
  year?: string;
  page?: string;
  limit?: string;
};

export async function sourceRoutes(
  app: FastifyInstance
) {
  app.get<{
    Querystring: SourceQuerystring;
  }>(
    "/",
    async (request, reply) => {
      const {
        q,
        institution
      } = request.query;

      let type:
        | SourceType
        | undefined;

      if (request.query.type) {
        const requestedType =
          request.query.type
            .trim()
            .toUpperCase();

        if (
          requestedType !==
            SourceType.OFFICIAL &&
          requestedType !==
            SourceType.SECONDARY
        ) {
          return reply
            .status(400)
            .send({
              error:
                "INVALID_SOURCE_TYPE",

              message:
                "Type must be OFFICIAL or SECONDARY."
            });
        }

        type =
          requestedType as SourceType;
      }

      let year:
        | number
        | undefined;

      if (request.query.year !== undefined) {
        const parsedYear =
          Number(request.query.year);

        if (
          !Number.isInteger(parsedYear) ||
          parsedYear < 1900 ||
          parsedYear > 2100
        ) {
          return reply
            .status(400)
            .send({
              error:
                "INVALID_SOURCE_YEAR",

              message:
                "Year must be an integer between 1900 and 2100."
            });
        }

        year = parsedYear;
      }

      const page =
        request.query.page !== undefined
          ? Number(request.query.page)
          : 1;

      const limit =
        request.query.limit !== undefined
          ? Number(request.query.limit)
          : 20;

      if (
        !Number.isInteger(page) ||
        page < 1
      ) {
        return reply
          .status(400)
          .send({
            error: "INVALID_PAGE",

            message:
              "Page must be an integer greater than or equal to 1."
          });
      }

      if (
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 100
      ) {
        return reply
          .status(400)
          .send({
            error: "INVALID_LIMIT",

            message:
              "Limit must be an integer between 1 and 100."
          });
      }

      const filters = {
        ...(q !== undefined
          ? { q }
          : {}),

        ...(type !== undefined
          ? { type }
          : {}),

        ...(institution !== undefined
          ? { institution }
          : {}),

        ...(year !== undefined
          ? { year }
          : {}),

        page,
        limit
      };

      const result =
        await getAllSources(filters);

      return {
        data: result.data,

        meta: {
          filters: {
            q: q ?? null,
            type: type ?? null,

            institution:
              institution ?? null,

            year:
              year ?? null
          },

          pagination:
            result.pagination
        }
      };
    }
  );

  app.get<{
    Params: {
      id: string;
    };
  }>(
    "/:id",
    async (request, reply) => {
      const source =
        await getSourceById(
          request.params.id
        );

      if (!source) {
        return reply
          .status(404)
          .send({
            error:
              "SOURCE_NOT_FOUND",

            message:
              "Source not found."
          });
      }

      return {
        data: source
      };
    }
  );
}
