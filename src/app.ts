import Fastify from "fastify";
import { registerRoutes } from "./routes/index.js";

export function buildApp() {
  const app = Fastify({
    logger: true
  });

  app.get("/", async () => {
    return {
      name: "moz-address-api",
      version: "0.1.0",
      description:
        "Open-source API for Mozambique's administrative divisions.",
      status: "ok"
    };
  });

  app.get("/health", async () => {
    return {
      status: "ok"
    };
  });

  app.register(registerRoutes, {
    prefix: "/api/v1"
  });

  return app;
}
