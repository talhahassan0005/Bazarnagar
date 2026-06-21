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
  adminEmail: process.env.ADMIN_EMAIL ?? "admin@bazaarnagar.com",
  adminPassword: process.env.ADMIN_PASSWORD ?? "admin123",
  get isProd() {
    return this.nodeEnv === "production";
  },
};
