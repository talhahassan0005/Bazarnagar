/**
 * Seeds 6 sample sellers/stores on the free (Starter) plan, so banner ads can
 * be checked on their shop pages. Additive only — never deletes existing
 * data; safe to run against a live database. Run with:
 * `npx tsx src/db/seed-starter-stores.ts`
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "./connect";
import { Seller } from "../models/Seller";
import { Store } from "../models/Store";

const img = (seed: string) => `https://picsum.photos/seed/${seed}/800/800`;
const cover = (seed: string) => `https://picsum.photos/seed/${seed}/1600/500`;
const PASSWORD = "password123";

const STORES = [
  { name: "Falak Kirana Store", slug: "falak-kirana", category: "Grocery", city: "Lahore", area: "Model Town", desc: "Daily groceries and household essentials at fair prices.", whatsapp: "0300-1110001" },
  { name: "Zain Mobile Accessories", slug: "zain-mobile-accessories", category: "Electronics", city: "Karachi", area: "Gulshan-e-Iqbal", desc: "Phone covers, chargers and mobile accessories.", whatsapp: "0300-1110002" },
  { name: "Hina's Closet", slug: "hinas-closet", category: "Clothing", city: "Islamabad", area: "G-9", desc: "Trendy ready-to-wear outfits for women.", whatsapp: "0300-1110003" },
  { name: "Bakers Corner", slug: "bakers-corner", category: "Bakery", city: "Faisalabad", area: "D Ground", desc: "Fresh cakes, pastries and baked goods.", whatsapp: "0300-1110004" },
  { name: "Glow Beauty Store", slug: "glow-beauty-store", category: "Cosmetics", city: "Multan", area: "Cantt", desc: "Affordable skincare and makeup essentials.", whatsapp: "0300-1110005" },
  { name: "Rawal Sports Hub", slug: "rawal-sports-hub", category: "Sports", city: "Rawalpindi", area: "Saddar", desc: "Sportswear, shoes and fitness gear.", whatsapp: "0300-1110006" },
];

async function run() {
  await connectDB();
  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  const now = new Date();
  const oneYear = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000);

  let created = 0;
  for (const s of STORES) {
    const email = `${s.slug.replace(/-/g, ".")}@bazaarnagar.test`;
    const existing = await Seller.findOne({ email });
    if (existing) {
      console.log(`Skipping ${s.name} — seller already exists (${email})`);
      continue;
    }

    const seller = await Seller.create({
      name: s.name,
      phone: s.whatsapp,
      email,
      passwordHash,
      status: "active",
      planId: "starter",
      subscriptionStatus: "active",
      subscriptionStartedAt: now,
      subscriptionEndsAt: oneYear,
    });

    const store = await Store.create({
      sellerId: seller._id,
      name: s.name,
      slug: s.slug,
      logoUrl: img(`${s.slug}-logo`),
      coverUrl: cover(`${s.slug}-cover`),
      description: s.desc,
      category: s.category,
      whatsapp: s.whatsapp,
      city: s.city,
      area: s.area,
      showLocation: false,
      showInSearch: true,
      isOpen: true,
      deliveryInfo: "Delivery available within the city.",
      paymentInfo: "Cash on Delivery",
      status: "active",
      views: 0,
      whatsappClicks: 0,
    });

    seller.storeId = store._id as typeof seller.storeId;
    await seller.save();

    console.log(`✓ ${s.name} — /store/${s.slug}  (login: ${email} / ${PASSWORD})`);
    created++;
  }

  console.log(`\nDone — ${created} new starter-plan store(s) created.`);
  await mongoose.disconnect();
  process.exit(0);
}

run().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
