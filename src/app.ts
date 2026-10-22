import Fastify from "fastify";

import cors from "@fastify/cors";
import rateLimit from "@fastify/rate-limit";

import {
  corsOptions,
  rateLimitOptions
} from "./config/http-protection.js";

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

  app.register(
    async function application(
      instance
    ) {
      await instance.register(
        cors,
        corsOptions
      );

      await instance.register(
        rateLimit,
        rateLimitOptions
      );

      await instance.register(
        registerSwagger
      );

      instance.get(
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
            name:
              "moz-address-api",

            version: "0.1.0",

            description:
              "Open-source API for Mozambique's administrative divisions.",

            status: "ok",

            documentation:
              "/docs"
          };
        }
      );

      instance.get(
        "/health",
        {
          config: {
            rateLimit: false
          },

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

      await instance.register(
        registerRoutes,
        {
          prefix: "/api/v1"
        }
      );
    }
  );

  return app;
}
