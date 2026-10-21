import type {
  FastifyInstance
} from "fastify";

import {
  DistrictType
} from "../../generated/prisma/client.js";

import {
  getAllDistricts,
  getDistrictByIdentifier
} from "./district.service.js";

import {
  getAdministrativePostByDistrictAndSlug,
  getAdministrativePostsByDistrict
} from "../administrative-posts/administrative-post.service.js";

import {
  getNeighborhoodByDistrictAndSlug,
  getNeighborhoodsByDistrict
} from "../localities/locality.service.js";

type DistrictQuerystring = {
  q?: string;
  province?: string;
  type?: string;
  page?: string;
  limit?: string;
};

export async function districtRoutes(
  app: FastifyInstance
) {
  app.get<{
    Querystring: DistrictQuerystring;
  }>(
    "/",
    async (request, reply) => {
      const {
        q,
        province
      } = request.query;

      let type:
        | DistrictType
        | undefined;

      if (request.query.type) {
        const requestedType =
          request.query.type
            .trim()
            .toUpperCase();

        if (
          requestedType !==
            DistrictType.DISTRICT &&
          requestedType !==
            DistrictType.MUNICIPAL_DISTRICT
        ) {
          return reply
            .status(400)
            .send({
              error:
                "INVALID_DISTRICT_TYPE",

              message:
                "Type must be DISTRICT or MUNICIPAL_DISTRICT."
            });
        }

        type =
          requestedType as DistrictType;
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

        ...(province !== undefined
          ? { province }
          : {}),

        ...(type !== undefined
          ? { type }
          : {}),

        page,
        limit
      };

      const result =
        await getAllDistricts(filters);

      return {
        data: result.data,

        meta: {
          filters: {
            q: q ?? null,
            province:
              province ?? null,
            type: type ?? null
          },

          pagination:
            result.pagination
        }
      };
    }
  );

  app.get<{
    Params: {
      identifier: string;
    };
  }>(
    "/:identifier",
    async (request, reply) => {
      const district =
        await getDistrictByIdentifier(
          request.params.identifier
        );

      if (!district) {
        return reply.status(404).send({
          error:
            "DISTRICT_NOT_FOUND",

          message:
            "District not found."
        });
      }

      return {
        data: district
      };
    }
  );

  app.get<{
    Params: {
      identifier: string;
    };
  }>(
    "/:identifier/administrative-posts",
    async (request, reply) => {
      const district =
        await getAdministrativePostsByDistrict(
          request.params.identifier
        );

      if (!district) {
        return reply.status(404).send({
          error:
            "DISTRICT_NOT_FOUND",

          message:
            "District not found."
        });
      }

      return {
        data:
          district.administrativePosts,

        meta: {
          district: {
            id: district.id,
            name: district.name,
            slug: district.slug
          },

          province: {
            id: district.province.id,
            name: district.province.name,
            slug: district.province.slug
          },

          total:
            district
              .administrativePosts
              .length
        }
      };
    }
  );

  app.get<{
    Params: {
      identifier: string;
      postSlug: string;
    };
  }>(
    "/:identifier/administrative-posts/:postSlug",
    async (request, reply) => {
      const administrativePost =
        await getAdministrativePostByDistrictAndSlug(
          request.params.identifier,
          request.params.postSlug
        );

      if (!administrativePost) {
        return reply.status(404).send({
          error:
            "ADMINISTRATIVE_POST_NOT_FOUND",

          message:
            "Administrative post not found in this district."
        });
      }

      return {
        data: administrativePost
      };
    }
  );

  app.get<{
    Params: {
      identifier: string;
    };
  }>(
    "/:identifier/neighborhoods",
    async (request, reply) => {
      const district =
        await getNeighborhoodsByDistrict(
          request.params.identifier
        );

      if (!district) {
        return reply.status(404).send({
          error:
            "DISTRICT_NOT_FOUND",

          message:
            "District not found."
        });
      }

      if (
        district.type !==
        "MUNICIPAL_DISTRICT"
      ) {
        return reply.status(400).send({
          error:
            "DISTRICT_HAS_NO_NEIGHBORHOOD_LAYER",

          message:
            "Neighborhoods are only available for municipal districts."
        });
      }

      return {
        data: district.localities,

        meta: {
          district: {
            id: district.id,
            name: district.name,
            slug: district.slug,
            type: district.type
          },

          province: {
            id: district.province.id,
            name: district.province.name,
            slug: district.province.slug
          },

          total:
            district.localities.length
        }
      };
    }
  );

  app.get<{
    Params: {
      identifier: string;
      neighborhoodSlug: string;
    };
  }>(
    "/:identifier/neighborhoods/:neighborhoodSlug",
    async (request, reply) => {
      const neighborhood =
        await getNeighborhoodByDistrictAndSlug(
          request.params.identifier,
          request.params
            .neighborhoodSlug
        );

      if (!neighborhood) {
        return reply.status(404).send({
          error:
            "NEIGHBORHOOD_NOT_FOUND",

          message:
            "Neighborhood not found in this district."
        });
      }

      return {
        data: neighborhood
      };
    }
  );
}
