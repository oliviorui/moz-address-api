import type {
  FastifyCorsOptions
} from "@fastify/cors";

import type {
  RateLimitPluginOptions
} from "@fastify/rate-limit";

import {
  env
} from "./env.js";

export function resolveTrustProxy(
  raw: string
): boolean | string {
  const value = raw.trim();

  if (
    value === "" ||
    value.toLowerCase() === "false"
  ) {
    return false;
  }

  return value.toLowerCase() === "true"
    ? true
    : value;
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
