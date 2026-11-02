import Fastify from "fastify";

import compress from "@fastify/compress";
import cors from "@fastify/cors";
import etag from "@fastify/etag";
import rateLimit from "@fastify/rate-limit";

import packageJson from "../package.json" with {
  type: "json"
};

import {
  env
} from "./config/env.js";

import {
  corsOptions,
  getClientIp,
  rateLimitOptions,
  resolveTrustProxy,
  serializeRequest,
  type TrustProxy
} from "./config/http-protection.js";

import {
  registerSwagger
} from "./config/swagger.js";

import {
  pingDatabase
} from "./lib/prisma.js";

import {
  registerRoutes
} from "./routes/index.js";

export type BuildAppOptions = {
  trustProxy?: TrustProxy;
  clientIpHeader?: string;
  checkDatabase?: () => Promise<void>;
};

export function buildApp(
  options: BuildAppOptions = {}
) {
  const checkDatabase =
    options.checkDatabase ??
    pingDatabase;

  const clientIpHeader =
    options.clientIpHeader ??
    env.CLIENT_IP_HEADER;

  const app = Fastify({
    logger: {
      serializers: {
        req: (request) =>
          serializeRequest(
            request,
            clientIpHeader
          )
      }
    },

    trustProxy:
      options.trustProxy ??
      resolveTrustProxy(
        env.TRUST_PROXY
      )
  });

  app.setErrorHandler<Error & {
    statusCode?: number;
  }>(
    (error, request, reply) => {
      if (
        error.statusCode !== undefined &&
        error.statusCode < 500
      ) {
        return reply.send(error);
      }

      request.log.error(error);

      return reply
        .status(500)
        .send({
          error:
            "INTERNAL_SERVER_ERROR",

          message:
            "An unexpected error occurred."
        });
    }
  );

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
        {
          ...rateLimitOptions,

          keyGenerator: (request) =>
            getClientIp(
              request,
              clientIpHeader
            )
        }
      );

      /*
       * ETag must come first so that it hashes the
       * response before it is compressed. It is weak
       * because compressed and plain bodies differ.
       */
      await instance.register(
        etag,
        {
          weak: true
        }
      );

      await instance.register(
        compress
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

            version:
              packageJson.version,

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

      instance.get(
        "/health/ready",
        {
          config: {
            rateLimit: false
          },

          schema: {
            tags: ["System"],

            summary:
              "Readiness check",

            description:
              "Checks whether the API can reach its database."
          }
        },
        async (request, reply) => {
          try {
            await checkDatabase();
          } catch (error) {
            request.log.error(error);

            return reply
              .status(503)
              .send({
                status: "unavailable"
              });
          }

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
