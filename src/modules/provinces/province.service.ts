import {
  ProvinceType,
  type Prisma
} from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

import {
  buildPaginationMeta,
  getPaginationInput
} from "../../lib/pagination.js";

export type ProvinceFilters = {
  q?: string;
  type?: ProvinceType;
  page?: number;
  limit?: number;
};

export async function getAllProvinces(
  filters: ProvinceFilters = {}
) {
  const where: Prisma.ProvinceWhereInput = {
    status: "ACTIVE"
  };

  if (filters.q) {
    const query = filters.q.trim();

    if (query) {
      where.OR = [
        {
          name: {
            contains: query,
            mode: "insensitive"
          }
        },
        {
          slug: {
            contains: query.toLowerCase(),
            mode: "insensitive"
          }
        },
        {
          capital: {
            contains: query,
            mode: "insensitive"
          }
        }
      ];
    }
  }

  if (filters.type) {
    where.type = filters.type;
  }

  const {
    page,
    limit,
    skip
  } = getPaginationInput(
    filters.page,
    filters.limit
  );

  const [data, total] =
    await Promise.all([
      prisma.province.findMany({
        where,

        skip,
        take: limit,

        orderBy: [
          {
            name: "asc"
          },
          {
            id: "asc"
          }
        ]
      }),

      prisma.province.count({
        where
      })
    ]);

  return {
    data,

    pagination:
      buildPaginationMeta(
        page,
        limit,
        total
      )
  };
}

export async function getProvinceByIdentifier(
  identifier: string
) {
  return prisma.province.findFirst({
    where: {
      status: "ACTIVE",

      OR: [
        {
          id: identifier
        },
        {
          slug: identifier.toLowerCase()
        }
      ]
    }
  });
}

export async function getProvinceDistricts(
  identifier: string
) {
  return prisma.province.findFirst({
    where: {
      status: "ACTIVE",

      OR: [
        {
          id: identifier
        },
        {
          slug: identifier.toLowerCase()
        }
      ]
    },

    include: {
      districts: {
        where: {
          status: "ACTIVE"
        },

        orderBy: {
          name: "asc"
        }
      }
    }
  });
}
