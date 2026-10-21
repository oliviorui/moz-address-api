import {
  SourceType,
  type Prisma
} from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

export type SourceFilters = {
  q?: string;
  type?: SourceType;
  institution?: string;
  year?: number;
  page?: number;
  limit?: number;
};

export async function getAllSources(
  filters: SourceFilters = {}
) {
  const where: Prisma.SourceWhereInput = {};

  if (filters.q) {
    const query = filters.q.trim();

    if (query) {
      where.OR = [
        {
          institution: {
            contains: query,
            mode: "insensitive"
          }
        },
        {
          title: {
            contains: query,
            mode: "insensitive"
          }
        },
        {
          notes: {
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

  if (filters.institution) {
    const institution =
      filters.institution.trim();

    if (institution) {
      where.institution = {
        contains: institution,
        mode: "insensitive"
      };
    }
  }

  if (filters.year !== undefined) {
    where.year = filters.year;
  }

  const page =
    filters.page ?? 1;

  const limit =
    filters.limit ?? 20;

  const skip =
    (page - 1) * limit;

  const [data, total] =
    await Promise.all([
      prisma.source.findMany({
        where,

        skip,
        take: limit,

        orderBy: [
          {
            year: "desc"
          },
          {
            institution: "asc"
          },
          {
            id: "asc"
          }
        ]
      }),

      prisma.source.count({
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

export async function getSourceById(
  id: string
) {
  return prisma.source.findUnique({
    where: {
      id
    }
  });
}
