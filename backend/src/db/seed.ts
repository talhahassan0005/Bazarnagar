/**
 * Seed script — wipes and repopulates the database with sample data that
 * mirrors the frontend mock (frontend/src/lib/mockData.ts), plus an admin
 * account from the environment. Run with: `npm run seed`.
 */
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import { connectDB } from "./connect";
import { env } from "../config/env";
import { Seller } from "../models/Seller";
import { Store } from "../models/Store";
import { Product } from "../models/Product";
import { Admin } from "../models/Admin";
import { Payment } from "../models/Payment";
import { Order } from "../models/Order";
import { Review } from "../models/Review";

const img = (seed: string) => `https://picsum.photos/seed/${seed}/800/800`;
const cover = (seed: string) => `https://picsum.photos/seed/${seed}/1600/500`;
const DEFAULT_SELLER_PASSWORD = "password123";

async function seed() {
  await connectDB();
  console.log("Clearing existing data…");
  await Promise.all([
    Seller.deleteMany({}),
    Store.deleteMany({}),
    Product.deleteMany({}),
    Admin.deleteMany({}),
    Payment.deleteMany({}),
    Order.deleteMany({}),
    Review.deleteMany({}),
  ]);

  // ---- Admin ----
  const adminHash = await bcrypt.hash(env.adminPassword, 10);
  await Admin.create({ name: "Admin", email: env.adminEmail, passwordHash: adminHash });
  console.log(`✓ Admin: ${env.adminEmail} / ${env.adminPassword}`);

  const sellerHash = await bcrypt.hash(DEFAULT_SELLER_PASSWORD, 10);

  // ---- Sellers ----
  const ayesha = await Seller.create({
    name: "Ayesha Khan",
    phone: "0300-1234567",
    email: "ayesha@example.com",
    passwordHash: sellerHash,
    status: "active",
    planId: "basic",
    subscriptionStatus: "active",
  });
  const bilal = await Seller.create({
    name: "Bilal Ahmed",
    phone: "0321-9876543",
    email: "bilal@example.com",
    passwordHash: sellerHash,
    status: "active",
    planId: "growth",
    subscriptionStatus: "active",
  });
  const sana = await Seller.create({
    name: "Sana Malik",
    phone: "0333-5552211",
    email: "sana@example.com",
    passwordHash: sellerHash,
    status: "suspended",
    planId: "starter",
    subscriptionStatus: "suspended",
  });

  // ---- Stores ----
  const store1 = await Store.create({
    sellerId: ayesha._id,
    name: "Ayesha Boutique",
    slug: "ayesha-boutique",
    logoUrl: img("ayesha-logo"),
    coverUrl: cover("ayesha-cover"),
    description:
      "Hand-picked unstitched & ready-to-wear women's clothing. New arrivals every week.",
    category: "Clothing",
    whatsapp: "0300-1234567",
    city: "Lahore",
    area: "Gulberg",
    fullAddress: "Main Boulevard, Gulberg III, Lahore",
    mapsLink: "https://maps.google.com/?q=Gulberg+Lahore",
    showLocation: true,
    showInSearch: true,
    socials: { instagram: "ayesha.boutique", facebook: "ayeshaboutique" },
    deliveryInfo: "Delivery across Pakistan within 3-5 days.",
    paymentInfo: "Cash on Delivery / Bank transfer",
    landing: {
      enabled: true,
      theme: "rose",
      headline: "Effortless eastern wear, delivered to your door",
      tagline:
        "Hand-picked unstitched & ready-to-wear with fresh arrivals every week.",
      heroImageUrl: cover("ayesha-hero"),
      primaryCtaLabel: "Shop the collection",
      showFeatured: true,
      featuredProductIds: [],
      showAbout: true,
      aboutTitle: "Why shop with Ayesha Boutique",
      aboutText:
        "We curate premium lawn, chiffon and party wear for women across Pakistan. Every piece is quality-checked before it ships, and our team is a WhatsApp message away for sizing help.",
      showContact: true,
    },
    status: "active",
    views: 420,
    whatsappClicks: 38,
  });
  const store2 = await Store.create({
    sellerId: bilal._id,
    name: "Bilal Electronics",
    slug: "bilal-electronics",
    logoUrl: img("bilal-logo"),
    coverUrl: cover("bilal-cover"),
    description: "Genuine mobile accessories, smart gadgets and home electronics.",
    category: "Electronics",
    whatsapp: "0321-9876543",
    city: "Karachi",
    area: "Saddar",
    showLocation: true,
    showInSearch: true,
    socials: { instagram: "bilal.electronics" },
    deliveryInfo: "Same-day delivery within Karachi.",
    paymentInfo: "COD / EasyPaisa / JazzCash",
    status: "active",
    views: 980,
    whatsappClicks: 112,
  });
  const store3 = await Store.create({
    sellerId: sana._id,
    name: "Sana Cosmetics",
    slug: "sana-cosmetics",
    logoUrl: img("sana-logo"),
    coverUrl: cover("sana-cover"),
    description: "Affordable makeup and skincare essentials for everyday glam.",
    category: "Cosmetics",
    whatsapp: "0333-5552211",
    city: "Islamabad",
    showLocation: false,
    showInSearch: true,
    deliveryInfo: "Delivery in twin cities.",
    paymentInfo: "COD only",
    status: "active",
    views: 150,
    whatsappClicks: 9,
  });

  // Link sellers -> stores
  ayesha.storeId = store1._id as typeof ayesha.storeId;
  bilal.storeId = store2._id as typeof bilal.storeId;
  sana.storeId = store3._id as typeof sana.storeId;
  await Promise.all([ayesha.save(), bilal.save(), sana.save()]);

  // ---- Products ----
  const products = await Product.create([
    {
      storeId: store1._id,
      name: "Black Embroidered Kurti",
      category: "Clothing",
      price: 2500,
      discountPrice: 1999,
      images: [img("kurti-1"), img("kurti-2"), img("kurti-3")],
      description: "Premium lawn kurti with detailed front embroidery. Sizes S-XL.",
      tags: ["kurti", "embroidered", "lawn", "women"],
      stockStatus: "in_stock",
      status: "active",
      negotiable: true,
      condition: "new",
      deliveryAvailable: true,
      moderationStatus: "approved",
      views: 210,
      whatsappClicks: 24,
    },
    {
      storeId: store1._id,
      name: "Printed Summer Lawn 3-Piece",
      category: "Clothing",
      price: 4500,
      images: [img("lawn-1"), img("lawn-2")],
      description: "Unstitched 3-piece printed lawn suit with chiffon dupatta.",
      tags: ["lawn", "3-piece", "summer", "unstitched"],
      stockStatus: "in_stock",
      status: "active",
      negotiable: false,
      condition: "new",
      deliveryAvailable: true,
      moderationStatus: "approved",
      views: 96,
      whatsappClicks: 7,
    },
    {
      storeId: store1._id,
      name: "Hand-Stitched Party Frock",
      category: "Clothing",
      price: 7800,
      images: [img("frock-1")],
      description: "Festive party wear frock with sequins.",
      tags: ["frock", "party", "festive"],
      stockStatus: "out_of_stock",
      status: "active",
      negotiable: true,
      condition: "new",
      moderationStatus: "pending",
      views: 40,
      whatsappClicks: 2,
    },
    {
      storeId: store2._id,
      name: "Wireless Earbuds Pro",
      category: "Electronics",
      price: 3200,
      discountPrice: 2799,
      images: [img("earbuds-1"), img("earbuds-2")],
      videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      description: "Bluetooth 5.3 earbuds with noise cancellation and 24h battery.",
      tags: ["earbuds", "bluetooth", "audio", "wireless"],
      stockStatus: "in_stock",
      status: "active",
      negotiable: false,
      condition: "new",
      deliveryAvailable: true,
      moderationStatus: "approved",
      views: 530,
      whatsappClicks: 61,
    },
    {
      storeId: store2._id,
      name: "Fast Charge 65W Adapter",
      category: "Electronics",
      price: 1800,
      images: [img("charger-1")],
      description: "GaN 65W USB-C charger compatible with laptops and phones.",
      tags: ["charger", "usb-c", "fast-charge"],
      stockStatus: "in_stock",
      status: "active",
      negotiable: true,
      condition: "new",
      deliveryAvailable: true,
      moderationStatus: "approved",
      views: 310,
      whatsappClicks: 28,
    },
    {
      storeId: store2._id,
      name: "Smart Watch Series 9 (Clone)",
      category: "Electronics",
      price: 4999,
      images: [img("watch-1"), img("watch-2")],
      description: "Fitness tracking smartwatch with calling support.",
      tags: ["smartwatch", "fitness", "wearable"],
      stockStatus: "in_stock",
      status: "inactive",
      negotiable: true,
      condition: "new",
      moderationStatus: "flagged",
      views: 88,
      whatsappClicks: 5,
    },
    {
      storeId: store3._id,
      name: "Matte Liquid Lipstick Set",
      category: "Cosmetics",
      price: 1500,
      discountPrice: 1199,
      images: [img("lipstick-1")],
      description: "Set of 6 long-lasting matte liquid lipsticks.",
      tags: ["lipstick", "matte", "makeup", "set"],
      stockStatus: "in_stock",
      status: "active",
      negotiable: false,
      condition: "new",
      deliveryAvailable: true,
      moderationStatus: "approved",
      views: 120,
      whatsappClicks: 14,
    },
    {
      storeId: store3._id,
      name: "Vitamin C Brightening Serum",
      category: "Cosmetics",
      price: 2200,
      images: [img("serum-1")],
      description: "Brightening face serum with 10% vitamin C.",
      tags: ["serum", "skincare", "vitamin-c"],
      stockStatus: "in_stock",
      status: "active",
      negotiable: false,
      condition: "new",
      moderationStatus: "needs_edit",
      views: 33,
      whatsappClicks: 1,
    },
  ]);

  // ---- Landing pages (one per store, only public products featured) ----
  const p0 = products[0]!; // Black Embroidered Kurti  (store1)
  const p1 = products[1]!; // Printed Summer Lawn      (store1)
  const p3 = products[3]!; // Wireless Earbuds Pro     (store2)
  const p4 = products[4]!; // Fast Charge 65W Adapter  (store2)
  const p6 = products[6]!; // Matte Lipstick Set       (store3)

  store1.landing!.featuredProductIds = [p0.id, p1.id];
  await store1.save();

  store2.landing = {
    enabled: true,
    theme: "emerald",
    headline: "Genuine gadgets, fair prices, fast delivery",
    tagline: "Mobile accessories, audio and smart home — all quality-checked.",
    heroImageUrl: cover("bilal-hero"),
    primaryCtaLabel: "Shop gadgets",
    showFeatured: true,
    featuredProductIds: [p3.id, p4.id],
    showAbout: true,
    aboutTitle: "Why Bilal Electronics",
    aboutText:
      "We stock only genuine products with a 7-day checking warranty. Same-day delivery within Karachi and nationwide shipping.",
    showContact: true,
  };
  await store2.save();

  store3.landing = {
    enabled: true,
    theme: "amber",
    headline: "Everyday glam, made affordable",
    tagline: "Makeup and skincare essentials for your daily routine.",
    heroImageUrl: cover("sana-hero"),
    primaryCtaLabel: "Explore products",
    showFeatured: true,
    featuredProductIds: [p6.id],
    showAbout: true,
    aboutTitle: "About Sana Cosmetics",
    aboutText:
      "Cruelty-free, skin-friendly cosmetics delivered across the twin cities.",
    showContact: true,
  };
  await store3.save();

  // ---- Sample reviews (approved so they show; one left pending for the queue) ----
  await Review.create([
    { productId: p0._id, storeId: store1._id, customerName: "Hira S.", rating: 5, status: "approved", comment: "Beautiful embroidery and the fabric is great quality. Highly recommend!" },
    { productId: p0._id, storeId: store1._id, customerName: "Mahnoor", rating: 4, status: "approved", comment: "Lovely kurti, fit was perfect. Delivery took a few days." },
    { productId: p1._id, storeId: store1._id, customerName: "Ayesha R.", rating: 5, status: "approved", comment: "Gorgeous prints and soft lawn. Will order again." },
    { productId: p3._id, storeId: store2._id, customerName: "Usman T.", rating: 5, status: "approved", comment: "Sound quality is excellent for the price. Battery lasts all day." },
    { productId: p3._id, storeId: store2._id, customerName: "Hamza", rating: 4, status: "approved", comment: "Good earbuds, solid packaging. Bass could be deeper." },
    { productId: p4._id, storeId: store2._id, customerName: "Zain", rating: 5, status: "approved", comment: "Charges my laptop and phone fast. Compact too." },
    { productId: p6._id, storeId: store3._id, customerName: "Iqra", rating: 4, status: "pending", comment: "Nice shades, lasts long. Loved the matte finish." },
  ]);

  // ---- Sample orders (varied statuses across all three stores) ----
  const line = (p: typeof p0, quantity: number) => ({
    productId: p._id,
    name: p.name,
    price: p.discountPrice ?? p.price,
    quantity,
    image: p.images[0],
  });
  const sum = (items: { price: number; quantity: number }[]) =>
    items.reduce((s, i) => s + i.price * i.quantity, 0);

  const o1 = [line(p0, 1)];
  const o2 = [line(p0, 2), line(p1, 1)];
  const o3 = [line(p3, 1), line(p4, 1)];
  const o4 = [line(p3, 1)];
  const o5 = [line(p6, 3)];

  await Order.create([
    { storeId: store1._id, customerName: "Fatima Noor", customerPhone: "0301-2223344", customerAddress: "House 12, Street 5, DHA Phase 4", customerCity: "Lahore", note: "Please call before delivery.", items: o1, total: sum(o1), status: "pending" },
    { storeId: store1._id, customerName: "Sadia K.", customerPhone: "0345-1122334", customerAddress: "Flat 3B, Askari 11", customerCity: "Lahore", items: o2, total: sum(o2), status: "delivered" },
    { storeId: store2._id, customerName: "Bilal R.", customerPhone: "0312-9988776", customerAddress: "Shop 4, Saddar", customerCity: "Karachi", items: o3, total: sum(o3), status: "shipped" },
    { storeId: store2._id, customerName: "Ahmed", customerPhone: "0300-5566778", customerAddress: "Gulshan Block 6", customerCity: "Karachi", items: o4, total: sum(o4), status: "confirmed" },
    { storeId: store3._id, customerName: "Mehwish", customerPhone: "0333-4455667", customerAddress: "Street 9, F-10", customerCity: "Islamabad", items: o5, total: sum(o5), status: "pending" },
  ]);

  console.log("✓ Seeded 1 admin, 3 sellers, 3 stores, 8 products, 7 reviews, 5 orders");
  console.log(`  Seller logins: ayesha@example.com / ${DEFAULT_SELLER_PASSWORD} (and bilal@, sana@)`);
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
