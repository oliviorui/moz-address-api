import swagger from "@fastify/swagger";
import swaggerUi from "@fastify/swagger-ui";

import type {
  FastifyInstance
} from "fastify";

export async function registerSwagger(
  app: FastifyInstance
) {
  await app.register(swagger, {
    openapi: {
      openapi: "3.1.0",

      info: {
        title: "Moz Address API",
        version: "0.1.0",

        description:
          "Open-source REST API for Mozambique's administrative divisions, including provinces, districts, administrative posts, localities and neighborhoods.",

        license: {
          name: "MIT"
        }
      },

      servers: [
        {
          url: "/",
          description:
            "Current server"
        }
      ],

      tags: [
        {
          name: "System",
          description:
            "API metadata and health endpoints."
        },
        {
          name: "Coverage",
          description:
            "Dataset completeness and verified coverage."
        },
        {
          name: "Search",
          description:
            "Global search across administrative divisions."
        },
        {
          name: "Tree",
          description:
            "Hierarchical representation of Mozambique's administrative divisions."
        },
        {
          name: "Provinces",
          description:
            "Provinces and Maputo City."
        },
        {
          name: "Districts",
          description:
            "Districts and municipal districts."
        },
        {
          name:
            "Administrative Posts",
          description:
            "Administrative posts."
        },
        {
          name: "Localities",
          description:
            "Localities and neighborhoods."
        },
        {
          name: "Sources",
          description:
            "Dataset source metadata."
        }
      ]
    }
  });

  await app.register(swaggerUi, {
    routePrefix: "/docs",

    uiConfig: {
      docExpansion: "list",
      deepLinking: true
    },

    staticCSP: true
  });
}
