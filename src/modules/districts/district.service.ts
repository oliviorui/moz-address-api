import { prisma } from "../../lib/prisma.js";

export async function getAllDistricts() {
  return prisma.district.findMany({
    where: {
      status: "ACTIVE"
    },

    orderBy: {
      name: "asc"
    },

    include: {
      province: true
    }
  });
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
