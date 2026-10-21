import {
  DistrictType,
  type Prisma
} from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

export type DistrictFilters = {
  q?: string;
  province?: string;
  type?: DistrictType;
  page?: number;
  limit?: number;
};

export async function getAllDistricts(
  filters: DistrictFilters = {}
) {
  const where: Prisma.DistrictWhereInput = {
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
        }
      ];
    }
  }

  if (filters.province) {
    const provinceIdentifier =
      filters.province.trim();

    const provinceSlug =
      provinceIdentifier.toLowerCase();

    if (provinceIdentifier) {
      where.province = {
        is: {
          OR: [
            {
              id: provinceIdentifier
            },
            {
              slug: provinceSlug
            }
          ]
        }
      };
    }
  }

  if (filters.type) {
    where.type = filters.type;
  }

  const page =
    filters.page ?? 1;

  const limit =
    filters.limit ?? 20;

  const skip =
    (page - 1) * limit;

  const [data, total] =
    await Promise.all([
      prisma.district.findMany({
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
        ],

        include: {
          province: true
        }
      }),

      prisma.district.count({
        where
      })
    ]);

  const totalPages =
    Math.ceil(total / limit);

  return {
    data,

    pagination: {
      page,
      limit,
      total,
      totalPages,

      hasNextPage:
        page < totalPages,

      hasPreviousPage:
        page > 1
    }
  };
}

export async function getDistrictByIdentifier(
  identifier: string
) {
  return prisma.district.findFirst({
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
      province: true,

      sources: {
        include: {
          source: true
        }
      }
    }
  });
}

export async function getDistrictsByProvince(
  provinceIdentifier: string
) {
  return prisma.district.findMany({
    where: {
      status: "ACTIVE",

      province: {
        OR: [
          {
            id: provinceIdentifier
          },
          {
            slug: provinceIdentifier.toLowerCase()
          }
        ]
      }
    },

    orderBy: {
      name: "asc"
    }
  });
}
