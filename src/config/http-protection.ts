import { isIP } from "node:net";

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

type RequestWithAddress = {
  ip: string;
  headers: Record<string, string | string[] | undefined>;
};

/*
 * Some platforms hide the client behind proxies that
 * X-Forwarded-For cannot see past, but report it in a header.
 * Anything that is not an IP address is ignored, so random
 * values cannot create new rate-limit buckets.
 */
export function getClientIp(
  request: RequestWithAddress,
  headerName: string
) {
  const value =
    headerName
      ? request.headers[
          headerName.toLowerCase()
        ]
      : undefined;

  return typeof value === "string" &&
    isIP(value.trim()) !== 0
    ? value.trim()
    : request.ip;
}

export function serializeRequest(
  request: RequestWithAddress & {
    method: string;
    url: string;
    host: string;
  },
  headerName: string
) {
  return {
    method: request.method,
    url: request.url,
    host: request.host,
    remoteAddress:
      getClientIp(request, headerName)
  };
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
