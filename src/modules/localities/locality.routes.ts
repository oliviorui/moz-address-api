import type {
  FastifyInstance
} from "fastify";

import {
  getAllLocalities,
  getLocalityById
} from "./locality.service.js";

export async function localityRoutes(
  app: FastifyInstance
) {
  app.get("/", async () => {
    const localities =
      await getAllLocalities();

    return {
      data: localities,

      meta: {
        total: localities.length
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
      const locality =
        await getLocalityById(
          request.params.id
        );

      if (!locality) {
        return reply.status(404).send({
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
