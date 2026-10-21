import type { FastifyInstance } from "fastify";

import {
  getAllDistricts,
  getDistrictByIdentifier
} from "./district.service.js";

import {
  getAdministrativePostByDistrictAndSlug,
  getAdministrativePostsByDistrict
} from "../administrative-posts/administrative-post.service.js";

export async function districtRoutes(
  app: FastifyInstance
) {
  app.get("/", async () => {
    const districts = await getAllDistricts();

    return {
      data: districts,

      meta: {
        total: districts.length
      }
    };
  });

  app.get<{
    Params: {
      identifier: string;
    };
  }>("/:identifier", async (request, reply) => {
    const district =
      await getDistrictByIdentifier(
        request.params.identifier
      );

    if (!district) {
      return reply.status(404).send({
        error: "DISTRICT_NOT_FOUND",
        message: "District not found."
      });
    }

    return {
      data: district
    };
  });

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
          error: "DISTRICT_NOT_FOUND",
          message: "District not found."
        });
      }

      return {
        data: district.administrativePosts,

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
            district.administrativePosts.length
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
}
