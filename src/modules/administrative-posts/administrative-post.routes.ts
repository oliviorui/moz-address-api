import type {
  FastifyInstance
} from "fastify";

import {
  administrativePostRouteSchemas
} from "../../config/openapi-schemas.js";

import {
  getAllAdministrativePosts,
  getAdministrativePostById
} from "./administrative-post.service.js";

import {
  getLocalitiesByAdministrativePost,
  getLocalityByAdministrativePostAndSlug
} from "../localities/locality.service.js";

type AdministrativePostQuerystring = {
  q?: string;
  district?: string;
  province?: string;
  page?: string;
  limit?: string;
};

export async function administrativePostRoutes(
  app: FastifyInstance
) {
  app.get<{
    Querystring:
      AdministrativePostQuerystring;
  }>(
    "/",
    {
      schema:
        administrativePostRouteSchemas
          .list
    },
    async (request, reply) => {
      const {
        q,
        district,
        province
      } = request.query;

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

        ...(district !== undefined
          ? { district }
          : {}),

        ...(province !== undefined
          ? { province }
          : {}),

        page,
        limit
      };

      const result =
        await getAllAdministrativePosts(
          filters
        );

      return {
        data: result.data,

        meta: {
          filters: {
            q: q ?? null,
            district:
              district ?? null,
            province:
              province ?? null
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
    {
      schema:
        administrativePostRouteSchemas
          .detail
    },
    async (request, reply) => {
      const administrativePost =
        await getAdministrativePostById(
          request.params.id
        );

      if (!administrativePost) {
        return reply.status(404).send({
          error:
            "ADMINISTRATIVE_POST_NOT_FOUND",

          message:
            "Administrative post not found."
        });
      }

      return {
        data: administrativePost
      };
    }
  );

  app.get<{
    Params: {
      id: string;
    };
  }>(
    "/:id/localities",
    {
      schema:
        administrativePostRouteSchemas
          .localities
    },
    async (request, reply) => {
      const administrativePost =
        await getLocalitiesByAdministrativePost(
          request.params.id
        );

      if (!administrativePost) {
        return reply.status(404).send({
          error:
            "ADMINISTRATIVE_POST_NOT_FOUND",

          message:
            "Administrative post not found."
        });
      }

      return {
        data:
          administrativePost.localities,

        meta: {
          administrativePost: {
            id:
              administrativePost.id,

            name:
              administrativePost.name,

            slug:
              administrativePost.slug
          },

          district: {
            id:
              administrativePost
                .district.id,

            name:
              administrativePost
                .district.name,

            slug:
              administrativePost
                .district.slug
          },

          province: {
            id:
              administrativePost
                .district
                .province.id,

            name:
              administrativePost
                .district
                .province.name,

            slug:
              administrativePost
                .district
                .province.slug
          },

          total:
            administrativePost
              .localities.length
        }
      };
    }
  );

  app.get<{
    Params: {
      id: string;
      localitySlug: string;
    };
  }>(
    "/:id/localities/:localitySlug",
    {
      schema:
        administrativePostRouteSchemas
          .localityDetail
    },
    async (request, reply) => {
      const locality =
        await getLocalityByAdministrativePostAndSlug(
          request.params.id,
          request.params.localitySlug
        );

      if (!locality) {
        return reply.status(404).send({
          error:
            "LOCALITY_NOT_FOUND",

          message:
            "Locality not found in this administrative post."
        });
      }

      return {
        data: locality
      };
    }
  );
}
