import express from "express";
import cors from "cors";
import morgan from "morgan";
import { env } from "./config/env";
import routes from "./routes";
import { UPLOAD_DIR } from "./middleware/upload";
import { notFound, errorHandler } from "./middleware/error";
import { webhook as stripeWebhook } from "./controllers/stripeController";

// Origins explicitly allowed via CLIENT_ORIGIN (comma-separated supported).
const allowedOrigins = new Set(
  env.clientOrigin
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean)
);

/** Allow configured origins plus any localhost/127.0.0.1 port in development. */
function isAllowedOrigin(origin: string): boolean {
  if (allowedOrigins.has(origin)) return true;
  return /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(origin);
}

export function createApp() {
  const app = express();

  app.use(
    cors({
      credentials: true,
      origin(origin, cb) {
        // No Origin header → non-browser request (curl, server-to-server).
        // Disallowed origins are denied silently (no CORS headers) rather than
        // throwing — the browser blocks them, and we avoid noisy error logs.
        cb(null, !origin || isAllowedOrigin(origin));
      },
    })
  );
  // Stripe webhook needs the RAW body for signature verification — mount it
  // before the JSON body parser.
  app.post(
    "/api/webhooks/stripe",
    express.raw({ type: "application/json" }),
    stripeWebhook
  );

  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true }));
  if (!env.isProd) app.use(morgan("dev"));

  // Serve uploaded images statically.
  app.use("/uploads", express.static(UPLOAD_DIR));

  // API routes.
  app.use("/api", routes);

  // 404 + error handling (must be last).
  app.use(notFound);
  app.use(errorHandler);

  return app;
}
