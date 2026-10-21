import { prisma } from "../../lib/prisma.js";

export type GlobalSearchOptions = {
  q: string;
  limit?: number;
};

export async function globalSearch(
  options: GlobalSearchOptions
) {
  const query = options.q.trim();
  const limit = options.limit ?? 10;

  const [
    provinces,
    districts,
    administrativePosts,
    localities
  ] = await Promise.all([
    prisma.province.findMany({
      where: {
        status: "ACTIVE",

        OR: [
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
          },
          {
            capital: {
              contains: query,
              mode: "insensitive"
            }
          }
        ]
      },

      orderBy: {
        name: "asc"
      },

      take: limit
    }),

    prisma.district.findMany({
      where: {
        status: "ACTIVE",

        OR: [
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
        ]
      },

      include: {
        province: true
      },

      orderBy: {
        name: "asc"
      },

      take: limit
    }),

    prisma.administrativePost.findMany({
      where: {
        status: "ACTIVE",

        OR: [
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
        ]
      },

      include: {
        district: {
          include: {
            province: true
          }
        }
      },

      orderBy: {
        name: "asc"
      },

      take: limit
    }),

    prisma.locality.findMany({
      where: {
        status: "ACTIVE",

        OR: [
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
        ]
      },

      include: {
        administrativePost: {
          include: {
            district: {
              include: {
                province: true
              }
            }
          }
        },

        district: {
          include: {
            province: true
          }
        }
      },

      orderBy: {
        name: "asc"
      },

      take: limit
    })
  ]);

  const total =
    provinces.length +
    districts.length +
    administrativePosts.length +
    localities.length;

  return {
    query,
    limit,
    total,

    results: {
      provinces,
      districts,
      administrativePosts,
      localities
    }
  };
}
