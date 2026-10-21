import type { FastifyInstance } from "fastify";

import {
  getAllAdministrativePosts,
  getAdministrativePostById
} from "./administrative-post.service.js";

export async function administrativePostRoutes(
  app: FastifyInstance
) {
  app.get("/", async () => {
    const administrativePosts =
      await getAllAdministrativePosts();

    return {
      data: administrativePosts,

      meta: {
        total: administrativePosts.length
      }
    };
  });

  app.get<{
    Params: {
      id: string;
    };
  }>("/:id", async (request, reply) => {
    const administrativePost =
      await getAdministrativePostById(
        request.params.id
      );

    if (!administrativePost) {
      return reply.status(404).send({
        error: "ADMINISTRATIVE_POST_NOT_FOUND",
        message:
          "Administrative post not found."
      });
    }

    return {
      data: administrativePost
    };
  });
}
