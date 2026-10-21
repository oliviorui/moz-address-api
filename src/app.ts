import Fastify from "fastify";

import {
  registerSwagger
} from "./config/swagger.js";

import {
  registerRoutes
} from "./routes/index.js";

export function buildApp() {
  const app = Fastify({
    logger: true
  });

  app.register(registerSwagger);

  app.get(
    "/",
    {
      schema: {
        tags: ["System"],

        summary:
          "Get API metadata",

        description:
          "Returns basic metadata and current API status."
      }
    },
    async () => {
      return {
        name: "moz-address-api",
        version: "0.1.0",

        description:
          "Open-source API for Mozambique's administrative divisions.",

        status: "ok",

        documentation:
          "/docs"
      };
    }
  );

  app.get(
    "/health",
    {
      schema: {
        tags: ["System"],

        summary:
          "Health check",

        description:
          "Checks whether the API process is responding."
      }
    },
    async () => {
      return {
        status: "ok"
      };
    }
  );

  app.register(registerRoutes, {
    prefix: "/api/v1"
  });

  return app;
}
