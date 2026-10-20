import type { FastifyInstance } from "fastify";

import {
  getAllProvinces,
  getProvinceByIdentifier
} from "./province.service.js";

export async function provinceRoutes(
  app: FastifyInstance
) {
  app.get("/", async () => {
    const provinces = getAllProvinces();

    return {
      data: provinces,
      meta: {
        total: provinces.length
      }
    };
  });

  app.get<{
    Params: {
      identifier: string;
    };
  }>("/:identifier", async (request, reply) => {
    const province = getProvinceByIdentifier(
      request.params.identifier
    );

    if (!province) {
      return reply.status(404).send({
        error: "PROVINCE_NOT_FOUND",
        message: "Province not found."
      });
    }

    return {
      data: province
    };
  });
}
