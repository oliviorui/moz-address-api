export const DEFAULT_PAGE = 1;
export const DEFAULT_LIMIT = 20;
export const MAX_LIMIT = 100;

export type PaginationMeta = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
};

/*
 * Safe integers keep the computed offset within
 * the range the database accepts.
 */
export function isValidPage(
  page: number
) {
  return (
    Number.isSafeInteger(page) &&
    page >= 1
  );
}

export function getPaginationInput(
  page?: number,
  limit?: number
) {
  const resolvedPage =
    page ?? DEFAULT_PAGE;

  const resolvedLimit =
    limit ?? DEFAULT_LIMIT;

  return {
    page: resolvedPage,
    limit: resolvedLimit,

    skip:
      (resolvedPage - 1) *
      resolvedLimit
  };
}

export function buildPaginationMeta(
  page: number,
  limit: number,
  total: number
): PaginationMeta {
  const totalPages =
    total === 0
      ? 0
      : Math.ceil(
          total / limit
        );

  return {
    page,
    limit,
    total,
    totalPages,

    hasNextPage:
      page < totalPages,

    hasPreviousPage:
      page > 1 &&
      totalPages > 0
  };
}
