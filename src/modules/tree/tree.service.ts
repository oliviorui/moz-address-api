import { prisma } from "../../lib/prisma.js";

export type TreeOptions = {
  province?: string;
};

export async function getAdministrativeTree(
  options: TreeOptions = {}
) {
  const provinceIdentifier =
    options.province?.trim();

  const provinces =
    await prisma.province.findMany({
      where: {
        status: "ACTIVE",

        ...(provinceIdentifier
          ? {
              OR: [
                {
                  id:
                    provinceIdentifier
                },
                {
                  slug:
                    provinceIdentifier
                      .toLowerCase()
                }
              ]
            }
          : {})
      },

      orderBy: {
        name: "asc"
      },

      select: {
        id: true,
        name: true,
        slug: true,
        type: true,
        capital: true,

        districts: {
          where: {
            status: "ACTIVE"
          },

          orderBy: {
            name: "asc"
          },

          select: {
            id: true,
            name: true,
            slug: true,
            type: true,

            administrativePosts: {
              where: {
                status: "ACTIVE"
              },

              orderBy: {
                name: "asc"
              },

              select: {
                id: true,
                name: true,
                slug: true,

                localities: {
                  where: {
                    status:
                      "ACTIVE"
                  },

                  orderBy: {
                    name: "asc"
                  },

                  select: {
                    id: true,
                    name: true,
                    slug: true,
                    type: true
                  }
                }
              }
            },

            localities: {
              where: {
                status: "ACTIVE",
                type:
                  "NEIGHBORHOOD"
              },

              orderBy: {
                name: "asc"
              },

              select: {
                id: true,
                name: true,
                slug: true,
                type: true
              }
            }
          }
        }
      }
    });

  const data =
    provinces.map((province) => ({
      id: province.id,
      name: province.name,
      slug: province.slug,
      type: province.type,
      capital: province.capital,

      districts:
        province.districts.map(
          (district) => ({
            id: district.id,
            name: district.name,
            slug: district.slug,
            type: district.type,

            administrativePosts:
              district
                .administrativePosts,

            neighborhoods:
              district.localities
          })
        )
    }));

  const counts =
    data.reduce(
      (acc, province) => {
        acc.provinces += 1;

        for (
          const district of
          province.districts
        ) {
          acc.districts += 1;

          acc.administrativePosts +=
            district
              .administrativePosts
              .length;

          acc.localities +=
            district
              .administrativePosts
              .reduce(
                (
                  total,
                  post
                ) =>
                  total +
                  post.localities
                    .length,
                0
              );

          acc.neighborhoods +=
            district
              .neighborhoods
              .length;
        }

        return acc;
      },
      {
        provinces: 0,
        districts: 0,
        administrativePosts: 0,
        localities: 0,
        neighborhoods: 0
      }
    );

  return {
    data,
    counts
  };
}
