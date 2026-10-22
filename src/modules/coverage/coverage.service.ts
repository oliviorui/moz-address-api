import { prisma } from "../../lib/prisma.js";

type CoverageStatus =
  | "COMPLETE"
  | "PARTIAL"
  | "UNKNOWN";

type CoverageMetric = {
  loaded: number;
  expected: number | null;
  missing: number | null;
  percentage: number | null;
  status: CoverageStatus;
};

const MAPUTO_PROVINCE_LOCALITY_TARGETS = [
  {
    districtId: "dist_maputo_boane",
    district: "Boane",
    expected: 3
  },
  {
    districtId: "dist_maputo_magude",
    district: "Magude",
    expected: 17
  },
  {
    districtId: "dist_maputo_manhica",
    district: "Manhiça",
    expected: 13
  },
  {
    districtId: "dist_maputo_marracuene",
    district: "Marracuene",
    expected: 8
  },
  {
    districtId: "dist_maputo_matutuine",
    district: "Matutuíne",
    expected: 14
  },
  {
    districtId: "dist_maputo_moamba",
    district: "Moamba",
    expected: 12
  },
  {
    districtId: "dist_maputo_namaacha",
    district: "Namaacha",
    expected: 9
  }
] as const;

function buildMetric(
  loaded: number,
  expected: number | null
): CoverageMetric {
  if (expected === null) {
    return {
      loaded,
      expected: null,
      missing: null,
      percentage: null,
      status: "UNKNOWN"
    };
  }

  const missing =
    Math.max(
      expected - loaded,
      0
    );

  const percentage =
    expected === 0
      ? 100
      : Number(
          (
            (loaded / expected) *
            100
          ).toFixed(1)
        );

  return {
    loaded,
    expected,
    missing,
    percentage:
      Math.min(
        percentage,
        100
      ),
    status:
      loaded >= expected
        ? "COMPLETE"
        : "PARTIAL"
  };
}

export async function getDataCoverage() {
  const [
    provinceCount,
    districtCount,
    administrativePostCount,
    localityCount,
    neighborhoodCount,
    maputoCityNeighborhoodCount,
    matolaNeighborhoodCount
  ] = await Promise.all([
    prisma.province.count({
      where: {
        status: "ACTIVE"
      }
    }),

    prisma.district.count({
      where: {
        status: "ACTIVE"
      }
    }),

    prisma.administrativePost.count({
      where: {
        status: "ACTIVE"
      }
    }),

    prisma.locality.count({
      where: {
        status: "ACTIVE",
        type: "LOCALITY"
      }
    }),

    prisma.locality.count({
      where: {
        status: "ACTIVE",
        type: "NEIGHBORHOOD"
      }
    }),

    prisma.locality.count({
      where: {
        status: "ACTIVE",
        type: "NEIGHBORHOOD",

        district: {
          is: {
            provinceId: "prov_11"
          }
        }
      }
    }),

    prisma.locality.count({
      where: {
        status: "ACTIVE",
        type: "NEIGHBORHOOD",

        administrativePost: {
          is: {
            districtId:
              "dist_maputo_matola"
          }
        }
      }
    })
  ]);

  const maputoDistricts =
    await Promise.all(
      MAPUTO_PROVINCE_LOCALITY_TARGETS.map(
        async (target) => {
          const loaded =
            await prisma.locality.count({
              where: {
                status: "ACTIVE",
                type: "LOCALITY",

                administrativePost: {
                  is: {
                    districtId:
                      target.districtId
                  }
                }
              }
            });

          return {
            districtId:
              target.districtId,
            district:
              target.district,
            localities:
              buildMetric(
                loaded,
                target.expected
              )
          };
        }
      )
    );

  const maputoProvinceLocalitiesLoaded =
    maputoDistricts.reduce(
      (
        total,
        district
      ) =>
        total +
        district.localities.loaded,
      0
    );

  const maputoProvinceLocalitiesExpected =
    MAPUTO_PROVINCE_LOCALITY_TARGETS.reduce(
      (
        total,
        district
      ) =>
        total +
        district.expected,
      0
    );

  return {
    national: {
      provinces:
        buildMetric(
          provinceCount,
          11
        ),

      districts:
        buildMetric(
          districtCount,
          161
        ),

      administrativePosts:
        buildMetric(
          administrativePostCount,
          null
        ),

      localities:
        buildMetric(
          localityCount,
          null
        ),

      neighborhoods:
        buildMetric(
          neighborhoodCount,
          null
        )
    },

    areas: {
      maputoCity: {
        name:
          "Cidade de Maputo",

        neighborhoods:
          buildMetric(
            maputoCityNeighborhoodCount,
            63
          ),

        sourceIds: [
          "cmm-maputo-pdm-2024-2028",
          "ine-maputo-city-yearbook-2024"
        ]
      },

      matola: {
        name:
          "Cidade da Matola",

        neighborhoods:
          buildMetric(
            matolaNeighborhoodCount,
            42
          ),

        sourceIds: [
          "cmm-matola-pla-2025"
        ]
      },

      maputoProvince: {
        name:
          "Província de Maputo",

        localities:
          buildMetric(
            maputoProvinceLocalitiesLoaded,
            maputoProvinceLocalitiesExpected
          ),

        neighborhoodsInMatola:
          buildMetric(
            matolaNeighborhoodCount,
            42
          ),

        districts:
          maputoDistricts,

        sourceIds: [
          "ine-maputo-province-yearbook-2024",
          "ine-maputo-territorial-statistics"
        ],

        notes: [
          "The current INE provincial yearbook reports 76 localities outside Matola and 42 city neighborhoods in Matola.",
          "Boane, Magude, Manhiça, Marracuene, Matutuíne, Moamba and Namaacha are tracked separately because locality names are being verified district by district.",
          "Administrative-post coverage is not marked complete nationally while the documented Cabo Delgado source discrepancy remains unresolved."
        ]
      }
    }
  };
}
