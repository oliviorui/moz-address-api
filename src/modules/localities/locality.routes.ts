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
            : {})
        };

        const localities =
        await getAllLocalities(filters);

      return {
        data: localities,

        meta: {
          total:
            localities.length,

          filters: {
            q: q ?? null,
            type: type ?? null,
            district:
              district ?? null,

            administrativePost:
              administrativePost ??
              null
          }
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
