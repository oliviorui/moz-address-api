import { prisma } from "../../lib/prisma.js";

export async function getAllProvinces() {
  return prisma.province.findMany({
    where: {
      status: "ACTIVE"
    },

    orderBy: {
      name: "asc"
    }
  });
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
