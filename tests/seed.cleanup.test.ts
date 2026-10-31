import assert from "node:assert/strict";
import {
  after,
  describe,
  it
} from "node:test";

import administrativePosts from "../data/current/administrative-posts.json" with {
  type: "json"
};
import districts from "../data/current/districts.json" with {
  type: "json"
};
import provinces from "../data/current/provinces.json" with {
  type: "json"
};
import localities from "../data/generated/localities.json" with {
  type: "json"
};
import localitySources from "../data/generated/locality-sources.json" with {
  type: "json"
};
import administrativePostSources from "../data/sources/administrative-post-sources.json" with {
  type: "json"
};
import districtSources from "../data/sources/district-sources.json" with {
  type: "json"
};
import sources from "../data/sources/sources.json" with {
  type: "json"
};

import {
  removeStaleRecords,
  sourceLinkKey
} from "../prisma/remove-stale.js";

import {
  closeDatabase,
  prisma
} from "../src/lib/prisma.js";

const canonical = {
  sourceIds:
    sources.map((item) => item.id),
  provinceIds:
    provinces.map((item) => item.id),
  districtIds:
    districts.map((item) => item.id),
  administrativePostIds:
    administrativePosts.map((item) => item.id),
  localityIds:
    localities.map((item) => item.id),

  districtSources: new Set(
    districtSources.map((item) =>
      sourceLinkKey(item.districtId, item.sourceId)
    )
  ),
  administrativePostSources: new Set(
    administrativePostSources.map((item) =>
      sourceLinkKey(item.administrativePostId, item.sourceId)
    )
  ),
  localitySources: new Set(
    localitySources.map((item) =>
      sourceLinkKey(item.localityId, item.sourceId)
    )
  )
};

after(async () => {
  await closeDatabase();
});

describe("removeStaleRecords", () => {
  it("removes a whole stale branch and keeps canonical records", async () => {
    const kept = canonical.localityIds[0] ?? "";

    const unlinkedSource =
      canonical.sourceIds.find(
        (sourceId) =>
          !canonical.localitySources.has(
            sourceLinkKey(kept, sourceId)
          )
      ) ?? "";

    await prisma.source.create({
      data: {
        id: "ghost-source",
        institution: "Ghost",
        title: "Ghost"
      }
    });

    await prisma.province.create({
      data: {
        id: "ghost-province",
        name: "Ghost",
        slug: "ghost-province",
        type: "PROVINCE",

        districts: {
          create: {
            id: "ghost-district",
            name: "Ghost",
            slug: "ghost-district",

            sources: {
              create: {
                sourceId: "ghost-source"
              }
            },

            administrativePosts: {
              create: {
                id: "ghost-post",
                name: "Ghost",
                slug: "ghost-post",

                sources: {
                  create: {
                    sourceId: "ghost-source"
                  }
                },

                localities: {
                  create: {
                    id: "ghost-locality",
                    name: "Ghost",
                    slug: "ghost-locality",

                    sources: {
                      create: {
                        sourceId: "ghost-source"
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    });

    /*
     * A stale link between two canonical records must go
     * too, without removing either record.
     */
    await prisma.localitySource.create({
      data: {
        localityId: kept,
        sourceId: unlinkedSource
      }
    });

    const removed =
      await removeStaleRecords(
        prisma,
        canonical
      );

    assert.deepEqual(
      removed,
      {
        links: 4,
        localities: 1,
        administrativePosts: 1,
        districts: 1,
        provinces: 1,
        sources: 1
      }
    );

    assert.equal(
      await prisma.locality.count(),
      1394
    );

    assert.equal(
      await prisma.administrativePost.count(),
      443
    );

    assert.equal(
      await prisma.district.count(),
      161
    );

    assert.equal(
      await prisma.province.count(),
      11
    );

    assert.equal(
      await prisma.source.count(),
      canonical.sourceIds.length
    );
  });
});
