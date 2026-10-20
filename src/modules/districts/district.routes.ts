import type { FastifyInstance } from "fastify";

import {
  getAllDistricts,
  getDistrictByIdentifier
} from "./district.service.js";

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
    const district = await getDistrictByIdentifier(
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
}
