import { buildApp } from "./app.js";
import { env } from "./config/env.js";
import { closeDatabase } from "./lib/prisma.js";

const app = buildApp();

async function shutdown(signal: NodeJS.Signals) {
  app.log.info(`Received ${signal}, shutting down.`);

  try {
    await app.close();
    await closeDatabase();
  } catch (error) {
    app.log.error(error);
    process.exitCode = 1;
  }
}

async function start() {
  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  try {
    await app.listen({
      host: env.HOST,
      port: env.PORT
    });

    app.log.info(
      `moz-address-api running on http://localhost:${env.PORT}`
    );
  } catch (error) {
    app.log.error(error);
    process.exit(1);
  }
}

start();
