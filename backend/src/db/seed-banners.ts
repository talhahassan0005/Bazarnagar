/**
 * Seeds two starter banner ads if none exist yet. Safe to run against a live
 * database — unlike seed.ts, this never deletes existing data. Run with:
 * `npx tsx src/db/seed-banners.ts`
 */
import mongoose from "mongoose";
import { connectDB } from "./connect";
import { env } from "../config/env";
import { Banner } from "../models/Banner";

async function seedBanners() {
  await connectDB();

  const existing = await Banner.countDocuments();
  if (existing > 0) {
    console.log(`Banner collection already has ${existing} document(s) — skipping seed.`);
    await mongoose.disconnect();
    process.exit(0);
  }

  const base = env.appUrl.replace(/\/$/, "");
  await Banner.create([
    {
      title: "Discover more shops",
      imageUrl: `${base}/banners/discover-shops.svg`,
      linkUrl: "/shops",
      active: true,
      order: 0,
    },
    {
      title: "New deals every day",
      imageUrl: `${base}/banners/new-deals.svg`,
      linkUrl: "/search",
      active: true,
      order: 1,
    },
  ]);

  console.log("✓ Seeded 2 starter banner ads");
  await mongoose.disconnect();
  process.exit(0);
}

seedBanners().catch((err) => {
  console.error("Banner seed failed:", err);
  process.exit(1);
});
