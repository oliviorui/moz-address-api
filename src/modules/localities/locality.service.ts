import { prisma } from "../../lib/prisma.js";

export async function getAllLocalities() {
  return prisma.locality.findMany({
    where: {
      status: "ACTIVE"
    },

    orderBy: {
      name: "asc"
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
    }
  });
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
