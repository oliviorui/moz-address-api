import type {
  FastifyInstance
} from "fastify";

import {
  ProvinceType
} from "../../generated/prisma/client.js";

import {
  provinceRouteSchemas
} from "../../config/openapi-schemas.js";

import {
  getAllProvinces,
  getProvinceByIdentifier,
  getProvinceDistricts
} from "./province.service.js";

type ProvinceQuerystring = {
  q?: string;
  type?: string;
  page?: string;
  limit?: string;
};

export async function provinceRoutes(
  app: FastifyInstance
) {
  app.get<{
    Querystring: ProvinceQuerystring;
  }>(
    "/",
    {
      schema:
        provinceRouteSchemas.list
    },
    async (request, reply) => {
      const {
        q
      } = request.query;

      let type:
        | ProvinceType
        | undefined;

      if (request.query.type) {
        const requestedType =
          request.query.type
            .trim()
            .toUpperCase();

        if (
          requestedType !==
            ProvinceType.PROVINCE &&
          requestedType !==
            ProvinceType.CAPITAL_CITY
        ) {
          return reply
            .status(400)
            .send({
              error:
                "INVALID_PROVINCE_TYPE",

              message:
                "Type must be PROVINCE or CAPITAL_CITY."
            });
        }

        type =
          requestedType as ProvinceType;
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

        ...(type !== undefined
          ? { type }
          : {}),

        page,
        limit
      };

      const result =
        await getAllProvinces(filters);

      return {
        data: result.data,

        meta: {
          filters: {
            q: q ?? null,
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
    {
      schema:
        provinceRouteSchemas.detail
    },
    async (request, reply) => {
      const province =
        await getProvinceByIdentifier(
          request.params.identifier
        );

      if (!province) {
        return reply
          .status(404)
          .send({
            error:
              "PROVINCE_NOT_FOUND",

            message:
              "Province not found."
          });
      }

      return {
        data: province
      };
    }
  );

  app.get<{
    Params: {
      identifier: string;
    };
  }>(
    "/:identifier/districts",
    {
      schema:
        provinceRouteSchemas.districts
    },
    async (request, reply) => {
      const province =
        await getProvinceDistricts(
          request.params.identifier
        );

      if (!province) {
        return reply
          .status(404)
          .send({
            error:
              "PROVINCE_NOT_FOUND",

            message:
              "Province not found."
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

          total:
            province.districts.length
        }
      };
    }
  );
}
