import dotenv from "dotenv";

dotenv.config();

/** Centralised, typed access to environment configuration. */
export const env = {
  port: Number(process.env.PORT ?? 5000),
  nodeEnv: process.env.NODE_ENV ?? "development",
  clientOrigin: process.env.CLIENT_ORIGIN ?? "http://localhost:3000",
  mongoUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/bazarnagar",
  jwtSecret: process.env.JWT_SECRET ?? "dev-insecure-secret-change-me",
  jwtExpiresIn: process.env.JWT_EXPIRES_IN ?? "7d",
  publicUrl: process.env.PUBLIC_URL ?? "http://localhost:5000",
  /** Frontend base URL used for links in emails (verify email, reset password, renew plan). */
  appUrl: (process.env.APP_URL ?? process.env.CLIENT_ORIGIN ?? "http://localhost:3000")
    .split(",")[0]!
    .trim(),
  // Cloudflare R2 (S3-compatible) image storage. Leave blank to keep saving
  // uploads to the local ./uploads folder (served at <PUBLIC_URL>/uploads).
  r2: {
    accountId: process.env.R2_ACCOUNT_ID ?? "",
    accessKeyId: process.env.R2_ACCESS_KEY_ID ?? "",
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY ?? "",
    bucket: process.env.R2_BUCKET ?? "",
    /** Public base URL of the bucket (r2.dev or a custom domain). */
    publicUrl: (process.env.R2_PUBLIC_URL ?? "").replace(/\/$/, ""),
  },
  get r2Enabled() {
    const r = this.r2;
    return Boolean(r.accountId && r.accessKeyId && r.secretAccessKey && r.bucket && r.publicUrl);
  },
  // Outgoing email (password resets). Leave SMTP_HOST blank in development to
  // print the email to the console instead of sending it.
  smtp: {
    host: process.env.SMTP_HOST ?? "",
    port: Number(process.env.SMTP_PORT ?? 465),
    user: process.env.SMTP_USER ?? "",
    pass: process.env.SMTP_PASS ?? "",
    /** Sender shown to recipients, e.g. `Bazarnagar <no-reply@bazaarnagar.com>`. */
    from: process.env.MAIL_FROM || process.env.SMTP_USER || "",
  },
  get mailEnabled() {
    return Boolean(this.smtp.host && this.smtp.user && this.smtp.pass);
  },
  /**
   * When true, new sellers start as "pending" and must pass CNIC (KYC)
   * verification before creating a store. Off unless set to "true". Keep in
   * sync with KYC_REQUIRED in frontend/src/lib/constants.ts.
   */
  kycRequired: process.env.KYC_REQUIRED === "true",
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@bazaarnagar.com",
  adminPassword: process.env.ADMIN_PASSWORD ?? "admin123",
  get isProd() {
    return this.nodeEnv === "production";
  },
};
