import {
  SourceType,
  type Prisma
} from "../../generated/prisma/client.js";

import { prisma } from "../../lib/prisma.js";

import {
  buildPaginationMeta,
  getPaginationInput
} from "../../lib/pagination.js";

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

export async function getSourceById(
  id: string
) {
  return prisma.source.findUnique({
    where: {
      id
    }
  });
}
