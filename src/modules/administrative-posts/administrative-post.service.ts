import { prisma } from "../../lib/prisma.js";

export async function getAllAdministrativePosts() {
  return prisma.administrativePost.findMany({
    where: {
      status: "ACTIVE"
    },

    orderBy: {
      name: "asc"
    },

    include: {
      district: {
        include: {
          province: true
        }
      }
    }
  });
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
            slug: districtIdentifier.toLowerCase()
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
      slug: postSlug.toLowerCase(),
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
