import { createApp } from "./app";
import { connectDB } from "./db/connect";
import { env } from "./config/env";
import { startSubscriptionScheduler } from "./lib/subscriptionScheduler";

async function start() {
  try {
    await connectDB();
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
