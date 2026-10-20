import { buildApp } from "./app.js";
import { env } from "./config/env.js";

const app = buildApp();

async function start() {
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
