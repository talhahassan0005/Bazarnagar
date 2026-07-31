import dotenv from "dotenv";

dotenv.config();

/** Centralised, typed access to environment configuration. */
export const env = {
  port: Number(process.env.PORT ?? 5000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000",
  mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/bazaarnagar",
  jwtSecret: process.env.JWT_SECRET ?? "dev-insecure-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  publicUrl: process.env.PUBLIC_URL ?? "http://localhost:5000",
  /** Frontend base URL used for payment gateway redirect (checkout return) links. */
  appUrl: (process.env.APP_URL ?? process.env.CLIENT_ORIGIN ?? "http://localhost:3000")
    .split(",")[0]!
    .trim(),
  // Stripe. Leave STRIPE_SECRET_KEY blank to run in mock mode (a local test
  // gateway) — same fallback behaviour the old Safepay integration had.
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  // Signing secret for the webhook endpoint (dashboard → Developers →
  // Webhooks → your endpoint → "Signing secret", starts with "whsec_").
  stripeWebhookSecret: process.env.STRIPE_WEBHOOK_SECRET ?? "",
  // Stripe does not support a Pakistani merchant account/PKR settlement, so
  // the currency actually charged depends on what the connected Stripe
  // account supports — override via env if it isn't USD.
  stripeCurrency: (process.env.STRIPE_CURRENCY ?? "usd").toLowerCase(),
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@bazaarnagar.com",
  adminPassword: process.env.ADMIN_PASSWORD ?? "admin123",
  get isProd() {
    return this.nodeEnv === "production";
  },
};
