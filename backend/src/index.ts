import bcrypt from "bcryptjs";
import { createApp } from "./app";
import { connectDB } from "./db/connect";
import { env } from "./config/env";
import { startSubscriptionScheduler } from "./lib/subscriptionScheduler";
import { Admin } from "./models/Admin";

async function ensureAdmin() {
  const exists = await Admin.findOne({ email: env.adminEmail });
  if (!exists) {
    const passwordHash = await bcrypt.hash(env.adminPassword, 10);
    await Admin.create({ name: "Admin", email: env.adminEmail, passwordHash });
    console.log(`✓ Admin created: ${env.adminEmail}`);
  }
}

async function start() {
  try {
    await connectDB();
    await ensureAdmin();
    const app = createApp();
    app.listen(env.port, () => {
      console.log(`✓ Bazaarnagar API running on http://localhost:${env.port}`);
      console.log(`  Health check: http://localhost:${env.port}/api/health`);
      startSubscriptionScheduler();
    });
  } catch (err) {
    console.error("✗ Failed to start server:", err);
    process.exit(1);
  }
}

start();
