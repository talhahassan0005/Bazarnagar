import { env } from "../config/env";

const allowedOrigins = new Set(
  env.clientOrigin
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);

/** Allow configured origins plus any localhost/127.0.0.1 port in development. */
export function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.has(origin)) return true;
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}
