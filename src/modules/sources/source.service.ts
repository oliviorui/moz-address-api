import { prisma } from "../../lib/prisma.js";

export async function getAllSources() {
  return prisma.source.findMany({
    orderBy: [
      {
        year: "desc"
      },
      {
        institution: "asc"
      }
    ]
  });
}

export async function getSourceById(id: string) {
  return prisma.source.findUnique({
    where: {
      id
    }
  });
}
