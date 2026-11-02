/*
 * Slugs have no accents, case or punctuation, so
 * searching them in the same form lets "Chokwè",
 * "chokwe" and "Xai Xai" find "Chókwè" and "Xai-Xai".
 */
export function toSearchSlug(
  query: string
) {
  return query
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/['’`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function nameOrSlugFilters(
  query: string
) {
  const slug =
    toSearchSlug(query);

  return [
    {
      name: {
        contains: query,
        mode: "insensitive" as const
      }
    },

    /*
     * An empty slug would match every record.
     */
    ...(slug
      ? [
          {
            slug: {
              contains: slug
            }
          }
        ]
      : [])
  ];
}
