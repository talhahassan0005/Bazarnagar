/**
 * Seeds starter banner ads (2 generic + 2 category-targeted) by upserting on
 * title, so it's safe to re-run any time to pick up newly added banners
 * without duplicating existing ones. Never deletes existing data. Run with:
 * `npx tsx src/db/seed-banners.ts`
 */
import mongoose from "mongoose";
import { connectDB } from "./connect";
import { env } from "../config/env";
import { Banner } from "../models/Banner";

async function seedBanners() {
  await connectDB();
  const base = env.appUrl.replace(/\/$/, "");

  const banners = [
    {
      title: "Discover more shops",
      imageUrl: `${base}/banners/discover-shops.svg`,
      linkUrl: "/shops",
      order: 0,
    },
    {
      title: "New deals every day",
      imageUrl: `${base}/banners/new-deals.svg`,
      linkUrl: "/search",
      order: 1,
    },
    {
      title: "Grocery savings",
      imageUrl: `${base}/banners/grocery-savings.svg`,
      linkUrl: "/search?category=Grocery",
      category: "Grocery",
      order: 2,
    },
    {
      title: "Electronics sale",
      imageUrl: `${base}/banners/electronics-sale.svg`,
      linkUrl: "/search?category=Electronics",
      category: "Electronics",
      order: 3,
    },
  ];

  let created = 0;
  let updated = 0;
  for (const b of banners) {
    const existing = await Banner.findOne({ title: b.title });
    await Banner.findOneAndUpdate(
      { title: b.title },
      { $setOnInsert: { active: true }, $set: b },
      { upsert: true, new: true }
    );
    if (existing) updated++;
    else created++;
  }

  console.log(`✓ Banners seeded — ${created} created, ${updated} updated (4 total).`);
  await mongoose.disconnect();
  process.exit(0);
}

seedBanners().catch((err) => {
  console.error("Banner seed failed:", err);
  process.exit(1);
});
