import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z
    .enum([
      "development",
      "test",
      "production"
    ])
    .default("development"),

  HOST:
    z.string()
      .default("0.0.0.0"),

  PORT:
    z.coerce
      .number()
      .int()
      .positive()
      .default(3333),

  DATABASE_URL:
    z.string()
      .optional(),

  CORS_ORIGIN:
    z.string()
      .default("*"),

  RATE_LIMIT_MAX:
    z.coerce
      .number()
      .int()
      .positive()
      .default(120),

  RATE_LIMIT_WINDOW:
    z.string()
      .default("1 minute")
});

export const env =
  envSchema.parse(process.env);
