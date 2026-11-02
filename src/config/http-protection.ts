import type {
  FastifyCorsOptions
} from "@fastify/cors";

import type {
  RateLimitPluginOptions
} from "@fastify/rate-limit";

import {
  env
} from "./env.js";

export type TrustProxy =
  | boolean
  | string
  | ((address: string, hop: number) => boolean);

export function resolveTrustProxy(
  raw: string
): TrustProxy {
  const value = raw.trim();

  if (
    value === "" ||
    value.toLowerCase() === "false"
  ) {
    return false;
  }

  if (value.toLowerCase() === "true") {
    return true;
  }

  /*
   * Fastify ignores a numeric trustProxy, so a proxy
   * count needs a function. Each trusted proxy appends the
   * address it saw, so anything further left can be forged.
   */
  if (/^\d+$/.test(value)) {
    const proxies = Number(value);

    return (_address, hop) =>
      hop < proxies;
  }

  return value;
}

function resolveCorsOrigin():
  boolean | string[] {
  const raw =
    env.CORS_ORIGIN.trim();

  if (
    raw === "*" ||
    raw.length === 0
  ) {
    return true;
  }

  return raw
    .split(",")
    .map((origin) =>
      origin.trim()
    )
    .filter(Boolean);
}

export const corsOptions:
  FastifyCorsOptions = {
    origin:
      resolveCorsOrigin(),

    methods: [
      "GET",
      "HEAD",
      "OPTIONS"
    ]
  };

export const rateLimitOptions:
  RateLimitPluginOptions = {
    global: true,

    max:
      env.RATE_LIMIT_MAX,

    timeWindow:
      env.RATE_LIMIT_WINDOW
  };
