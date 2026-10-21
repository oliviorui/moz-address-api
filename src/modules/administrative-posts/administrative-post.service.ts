import type {
  Prisma
} from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

export type AdministrativePostFilters = {
  q?: string;
  district?: string;
  province?: string;
  page?: number;
  limit?: number;
};

export async function getAllAdministrativePosts(
  filters: AdministrativePostFilters = {}
) {
  const where:
    Prisma.AdministrativePostWhereInput = {
      status: "ACTIVE"
    };

  if (filters.q) {
    const query =
      filters.q.trim();

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
            contains:
              query.toLowerCase(),
            mode: "insensitive"
          }
        }
      ];
    }
  }

  if (filters.district) {
    const districtIdentifier =
      filters.district.trim();

    const districtSlug =
      districtIdentifier.toLowerCase();

    if (districtIdentifier) {
      where.district = {
        is: {
          status: "ACTIVE",

          OR: [
            {
              id:
                districtIdentifier
            },
            {
              slug:
                districtSlug
            }
          ]
        }
      };
    }
  }

  if (filters.province) {
    const provinceIdentifier =
      filters.province.trim();

    const provinceSlug =
      provinceIdentifier.toLowerCase();

    if (provinceIdentifier) {
      const provinceCondition:
        Prisma.DistrictWhereInput = {
          province: {
            is: {
              OR: [
                {
                  id:
                    provinceIdentifier
                },
                {
                  slug:
                    provinceSlug
                }
              ]
            }
          }
        };

      where.AND = [
        ...(Array.isArray(where.AND)
          ? where.AND
          : where.AND
            ? [where.AND]
            : []),

        {
          district: {
            is: provinceCondition
          }
        }
      ];
    }
  }

  const page =
    filters.page ?? 1;

  const limit =
    filters.limit ?? 20;

  const skip =
    (page - 1) * limit;

  const [data, total] =
    await Promise.all([
      prisma.administrativePost.findMany({
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
          district: {
            include: {
              province: true
            }
          }
        }
      }),

      prisma.administrativePost.count({
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

export async function getAdministrativePostById(
  id: string
) {
  return prisma.administrativePost.findFirst({
    where: {
      id,
      status: "ACTIVE"
    },

    include: {
      district: {
        include: {
          province: true
        }
      },

      sources: {
        include: {
          source: true
        }
      }
    }
  });
}

export async function getAdministrativePostsByDistrict(
  districtIdentifier: string
) {
  return prisma.district.findFirst({
    where: {
      status: "ACTIVE",

      OR: [
        {
          id: districtIdentifier
        },
        {
          slug: districtIdentifier.toLowerCase()
        }
      ]
    },

    include: {
      province: true,

      administrativePosts: {
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

export async function getAdministrativePostByDistrictAndSlug(
  districtIdentifier: string,
  postSlug: string
) {
  const district =
    await prisma.district.findFirst({
      where: {
        status: "ACTIVE",

        OR: [
          {
            id: districtIdentifier
          },
          {
            slug:
              districtIdentifier.toLowerCase()
          }
        ]
      },

      select: {
        id: true
      }
    });

  if (!district) {
    return null;
  }

  return prisma.administrativePost.findFirst({
    where: {
      districtId: district.id,
      slug:
        postSlug.toLowerCase(),
      status: "ACTIVE"
    },

    include: {
      district: {
        include: {
          province: true
        }
      },

      sources: {
        include: {
          source: true
        }
      }
    }
  });
}
