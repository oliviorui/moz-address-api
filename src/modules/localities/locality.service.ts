import {
  LocalityType,
  type Prisma
} from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

import {
  buildPaginationMeta,
  getPaginationInput
} from "../../lib/pagination.js";

export type LocalityFilters = {
  q?: string;
  type?: LocalityType;
  district?: string;
  administrativePost?: string;
  page?: number;
  limit?: number;
};

export async function getAllLocalities(
  filters: LocalityFilters = {}
) {
  const where: Prisma.LocalityWhereInput = {
    status: "ACTIVE"
  };

  /*
   * Search by name or slug.
   */
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

  /*
   * LOCALITY | NEIGHBORHOOD
   */
  if (filters.type) {
    where.type = filters.type;
  }

  /*
   * District may be supplied by ID or slug.
   *
   * For NEIGHBORHOOD the district is directly
   * referenced by districtId.
   *
   * For LOCALITY the district is reached through:
   *
   * Locality
   * → AdministrativePost
   * → District
   */
  if (filters.district) {
    const districtIdentifier =
      filters.district.trim();

    const districtSlug =
      districtIdentifier.toLowerCase();

    if (districtIdentifier) {
      where.AND = [
        ...(Array.isArray(where.AND)
          ? where.AND
          : where.AND
            ? [where.AND]
            : []),

        {
          OR: [
            {
              district: {
                is: {
                  status: "ACTIVE",

                  OR: [
                    {
                      id: districtIdentifier
                    },
                    {
                      slug: districtSlug
                    }
                  ]
                }
              }
            },

            {
              administrativePost: {
                is: {
                  status: "ACTIVE",

                  district: {
                    is: {
                      status: "ACTIVE",

                      OR: [
                        {
                          id: districtIdentifier
                        },
                        {
                          slug: districtSlug
                        }
                      ]
                    }
                  }
                }
              }
            }
          ]
        }
      ];
    }
  }

  /*
   * Administrative post may be supplied by
   * ID or slug.
   */
  if (filters.administrativePost) {
    const postIdentifier =
      filters.administrativePost.trim();

    const postSlug =
      postIdentifier.toLowerCase();

    if (postIdentifier) {
      where.administrativePost = {
        is: {
          status: "ACTIVE",

          OR: [
            {
              id: postIdentifier
            },
            {
              slug: postSlug
            }
          ]
        }
      };
    }
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
      prisma.locality.findMany({
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
        }
      }),

      prisma.locality.count({
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

export async function getLocalityById(
  id: string
) {
  return prisma.locality.findFirst({
    where: {
      id,
      status: "ACTIVE"
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
      },

      sources: {
        include: {
          source: true
        }
      }
    }
  });
}

export async function getNeighborhoodsByDistrict(
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
          slug:
            districtIdentifier.toLowerCase()
        }
      ]
    },

    include: {
      province: true,

      localities: {
        where: {
          status: "ACTIVE",
          type: "NEIGHBORHOOD"
        },

        orderBy: {
          name: "asc"
        }
      }
    }
  });
}

export async function getNeighborhoodByDistrictAndSlug(
  districtIdentifier: string,
  neighborhoodSlug: string
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

  return prisma.locality.findFirst({
    where: {
      districtId: district.id,
      slug:
        neighborhoodSlug.toLowerCase(),
      type: "NEIGHBORHOOD",
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

export async function getLocalitiesByAdministrativePost(
  administrativePostId: string
) {
  return prisma.administrativePost.findFirst({
    where: {
      id: administrativePostId,
      status: "ACTIVE"
    },

    include: {
      district: {
        include: {
          province: true
        }
      },

      localities: {
        where: {
          status: "ACTIVE",
          type: "LOCALITY"
        },

        orderBy: {
          name: "asc"
        }
      }
    }
  });
}

export async function getLocalityByAdministrativePostAndSlug(
  administrativePostId: string,
  localitySlug: string
) {
  const administrativePost =
    await prisma.administrativePost.findFirst({
      where: {
        id: administrativePostId,
        status: "ACTIVE"
      },

      select: {
        id: true
      }
    });

  if (!administrativePost) {
    return null;
  }

  return prisma.locality.findFirst({
    where: {
      administrativePostId:
        administrativePost.id,
      slug: localitySlug.toLowerCase(),
      type: "LOCALITY",
      status: "ACTIVE"
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

      sources: {
        include: {
          source: true
        }
      }
    }
  });
}
