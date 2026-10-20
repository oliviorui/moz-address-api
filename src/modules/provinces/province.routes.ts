import type { FastifyInstance } from "fastify";

import {
  getAllProvinces,
  getProvinceByIdentifier,
  getProvinceDistricts
} from "./province.service.js";

export async function provinceRoutes(
  app: FastifyInstance
) {
  app.get("/", async () => {
    const provinces = await getAllProvinces();

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
    const province = await getProvinceByIdentifier(
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

  app.get<{
    Params: {
      identifier: string;
    };
  }>("/:identifier/districts", async (request, reply) => {
    const province = await getProvinceDistricts(
      request.params.identifier
    );

    if (!province) {
      return reply.status(404).send({
        error: "PROVINCE_NOT_FOUND",
        message: "Province not found."
      });
    }

    return {
      data: province.districts,

      meta: {
        province: {
          id: province.id,
          name: province.name,
          slug: province.slug
        },

        total: province.districts.length
      }
    };
  });
}
