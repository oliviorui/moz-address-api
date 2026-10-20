import type { FastifyInstance } from "fastify";

import {
  getAllSources,
  getSourceById
} from "./source.service.js";

export async function sourceRoutes(
  app: FastifyInstance
) {
  app.get("/", async () => {
    const sources = await getAllSources();

    return {
      data: sources,
      meta: {
        total: sources.length
      }
    };
  });

  app.get<{
    Params: {
      id: string;
    };
  }>("/:id", async (request, reply) => {
    const source = await getSourceById(
      request.params.id
    );

    if (!source) {
      return reply.status(404).send({
        error: "SOURCE_NOT_FOUND",
        message: "Source not found."
      });
    }

    return {
      data: source
    };
  });
}
