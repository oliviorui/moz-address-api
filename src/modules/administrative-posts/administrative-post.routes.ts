import type {
  FastifyInstance
} from "fastify";

import {
  getAllAdministrativePosts,
  getAdministrativePostById
} from "./administrative-post.service.js";

import {
  getLocalitiesByAdministrativePost,
  getLocalityByAdministrativePostAndSlug
} from "../localities/locality.service.js";

export async function administrativePostRoutes(
  app: FastifyInstance
) {
  app.get("/", async () => {
    const administrativePosts =
      await getAllAdministrativePosts();

    return {
      data: administrativePosts,

      meta: {
        total:
          administrativePosts.length
      }
    };
  });

  app.get<{
    Params: {
      id: string;
    };
  }>(
    "/:id",
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
