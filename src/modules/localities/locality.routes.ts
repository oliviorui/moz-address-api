import type {
  FastifyInstance
} from "fastify";

import {
  LocalityType
} from "../../generated/prisma/client.js";

import {
  getAllLocalities,
  getLocalityById
} from "./locality.service.js";

type LocalityQuerystring = {
  q?: string;
  type?: string;
  district?: string;
  administrativePost?: string;
  page?: string;
  limit?: string;
};

export async function localityRoutes(
  app: FastifyInstance
) {
  app.get<{
    Querystring: LocalityQuerystring;
  }>(
    "/",
    async (request, reply) => {
      const {
        q,
        district,
        administrativePost
      } = request.query;

      let type:
        | LocalityType
        | undefined;

      if (request.query.type) {
        const requestedType =
          request.query.type
            .trim()
            .toUpperCase();

        if (
          requestedType !==
            LocalityType.LOCALITY &&
          requestedType !==
            LocalityType.NEIGHBORHOOD
        ) {
          return reply
            .status(400)
            .send({
              error:
                "INVALID_LOCALITY_TYPE",

              message:
                "Type must be LOCALITY or NEIGHBORHOOD."
            });
        }

        type =
          requestedType as LocalityType;
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

        ...(district !== undefined
          ? { district }
          : {}),

        ...(administrativePost !== undefined
          ? { administrativePost }
          : {}),

        page,
        limit
      };

      const result =
        await getAllLocalities(filters);

      return {
        data: result.data,

        meta: {
          filters: {
            q: q ?? null,
            type: type ?? null,
            district:
              district ?? null,

            administrativePost:
              administrativePost ?? null
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
      const locality =
        await getLocalityById(
          request.params.id
        );

      if (!locality) {
        return reply
          .status(404)
          .send({
            error:
              "LOCALITY_NOT_FOUND",

            message:
              "Locality or neighborhood not found."
          });
      }

      return {
        data: locality
      };
    }
  );
}
