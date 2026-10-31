import type {
  PrismaClient
} from "../src/generated/prisma/client.js";

export type CanonicalIds = {
  sourceIds: string[];
  provinceIds: string[];
  districtIds: string[];
  administrativePostIds: string[];
  localityIds: string[];

  districtSources: Set<string>;
  administrativePostSources: Set<string>;
  localitySources: Set<string>;
};

export function sourceLinkKey(
  recordId: string,
  sourceId: string
) {
  return `${recordId}::${sourceId}`;
}

/*
 * The canonical files are the source of truth, so a
 * record removed or renamed there must not survive as
 * a "ghost" row after an upsert seed. Children go first
 * because parents are protected by onDelete: Restrict.
 */
export async function removeStaleRecords(
  prisma: PrismaClient,
  canonical: CanonicalIds
) {
  const removed = {
    links: 0,
    localities: 0,
    administrativePosts: 0,
    districts: 0,
    provinces: 0,
    sources: 0
  };

  const localityLinks =
    await prisma.localitySource.findMany({
      select: {
        localityId: true,
        sourceId: true
      }
    });

  for (const link of localityLinks) {
    if (
      !canonical.localitySources.has(
        sourceLinkKey(link.localityId, link.sourceId)
      )
    ) {
      await prisma.localitySource.delete({
        where: {
          localityId_sourceId: link
        }
      });

      removed.links += 1;
    }
  }

  const postLinks =
    await prisma.administrativePostSource.findMany({
      select: {
        administrativePostId: true,
        sourceId: true
      }
    });

  for (const link of postLinks) {
    if (
      !canonical.administrativePostSources.has(
        sourceLinkKey(link.administrativePostId, link.sourceId)
      )
    ) {
      await prisma.administrativePostSource.delete({
        where: {
          administrativePostId_sourceId: link
        }
      });

      removed.links += 1;
    }
  }

  const districtLinks =
    await prisma.districtSource.findMany({
      select: {
        districtId: true,
        sourceId: true
      }
    });

  for (const link of districtLinks) {
    if (
      !canonical.districtSources.has(
        sourceLinkKey(link.districtId, link.sourceId)
      )
    ) {
      await prisma.districtSource.delete({
        where: {
          districtId_sourceId: link
        }
      });

      removed.links += 1;
    }
  }

  removed.localities = (
    await prisma.locality.deleteMany({
      where: {
        id: {
          notIn: canonical.localityIds
        }
      }
    })
  ).count;

  removed.administrativePosts = (
    await prisma.administrativePost.deleteMany({
      where: {
        id: {
          notIn: canonical.administrativePostIds
        }
      }
    })
  ).count;

  removed.districts = (
    await prisma.district.deleteMany({
      where: {
        id: {
          notIn: canonical.districtIds
        }
      }
    })
  ).count;

  removed.provinces = (
    await prisma.province.deleteMany({
      where: {
        id: {
          notIn: canonical.provinceIds
        }
      }
    })
  ).count;

  removed.sources = (
    await prisma.source.deleteMany({
      where: {
        id: {
          notIn: canonical.sourceIds
        }
      }
    })
  ).count;

  return removed;
}
