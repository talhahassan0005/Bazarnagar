/**
 * Add ~24 sample products WITH locations — without wiping anything.
 *
 * Each product is attached to an existing searchable store and pinned to that
 * store's city (small jitter so they don't stack on one point). At least 5 are
 * pinned in Lahore. Products are created approved + active so they show on the
 * homepage / search immediately, and carry real product photos.
 *
 * Safe to re-run only if you want MORE products (it always inserts). Run with:
 *   npm run add:products
 */
import mongoose from "mongoose";
import { connectDB } from "./connect";
import { Store } from "../models/Store";
import { Product } from "../models/Product";

const CITY_COORDS: Record<string, { lat: number; lng: number }> = {
  Lahore: { lat: 31.5204, lng: 74.3587 },
  Karachi: { lat: 24.8607, lng: 67.0011 },
  Islamabad: { lat: 33.6844, lng: 73.0479 },
  Rawalpindi: { lat: 33.5651, lng: 73.0169 },
  Faisalabad: { lat: 31.418, lng: 73.0791 },
  Multan: { lat: 30.1575, lng: 71.5249 },
  Peshawar: { lat: 34.0151, lng: 71.5249 },
  Quetta: { lat: 30.1798, lng: 66.975 },
  Sialkot: { lat: 32.4945, lng: 74.5229 },
  Gujranwala: { lat: 32.1877, lng: 74.1945 },
};

const u = (id: string) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=800&q=70`;
const jitter = () => (Math.random() - 0.5) * 0.06; // ±~3km

type Seed = {
  name: string;
  category: string;
  price: number;
  discountPrice?: number;
  img: string;
  tags: string[];
};

const PRODUCTS: Seed[] = [
  { name: "Embroidered Lawn Suit", category: "Clothing", price: 3500, discountPrice: 2800, img: u("1594633312681-425c7b97ccd1"), tags: ["lawn", "suit", "embroidered"] },
  { name: "Cotton Kurta", category: "Clothing", price: 2200, img: u("1490481651871-ab68de25d43d"), tags: ["kurta", "cotton"] },
  { name: "Denim Jacket", category: "Clothing", price: 4200, img: u("1483985988355-763728e1935b"), tags: ["denim", "jacket"] },
  { name: "Silk Dupatta", category: "Accessories", price: 1200, img: u("1594633312681-425c7b97ccd1"), tags: ["dupatta", "silk"] },
  { name: "Matte Lipstick Pack", category: "Cosmetics", price: 1500, discountPrice: 1199, img: u("1586495777744-4413f21062fa"), tags: ["lipstick", "makeup"] },
  { name: "Face Serum", category: "Cosmetics", price: 2500, img: u("1586495777744-4413f21062fa"), tags: ["serum", "skincare"] },
  { name: "Perfume 100ml", category: "Cosmetics", price: 2900, discountPrice: 2400, img: u("1586495777744-4413f21062fa"), tags: ["perfume", "fragrance"] },
  { name: "Wireless Earbuds Pro", category: "Electronics", price: 3200, discountPrice: 2799, img: u("1590658268037-6bf12165a8df"), tags: ["earbuds", "wireless"] },
  { name: "Bluetooth Speaker", category: "Electronics", price: 4500, discountPrice: 3999, img: u("1505740420928-5e560c06d30e"), tags: ["speaker", "bluetooth"] },
  { name: "Smart Watch", category: "Electronics", price: 6500, discountPrice: 5500, img: u("1523275335684-37898b6baf30"), tags: ["watch", "smart"] },
  { name: "Power Bank 20000mAh", category: "Electronics", price: 2800, img: u("1505740420928-5e560c06d30e"), tags: ["powerbank", "charger"] },
  { name: "Leather Wallet", category: "Accessories", price: 1800, img: u("1523275335684-37898b6baf30"), tags: ["wallet", "leather"] },
  { name: "Handbag", category: "Accessories", price: 3800, img: u("1523275335684-37898b6baf30"), tags: ["handbag", "bag"] },
  { name: "Sunglasses", category: "Accessories", price: 1500, img: u("1511499767150-a48a237f0083"), tags: ["sunglasses", "shades"] },
  { name: "Running Shoes", category: "Shoes", price: 5000, discountPrice: 4200, img: u("1542291026-7eec264c27ff"), tags: ["shoes", "running"] },
  { name: "Sneakers", category: "Shoes", price: 3500, img: u("1542291026-7eec264c27ff"), tags: ["sneakers", "casual"] },
  { name: "Ceramic Mug Set", category: "Home & Living", price: 1600, img: u("1441986300917-64674bd600d8"), tags: ["mug", "kitchen"] },
  { name: "Table Lamp", category: "Home & Living", price: 2200, img: u("1441986300917-64674bd600d8"), tags: ["lamp", "decor"] },
  { name: "Organic Honey 1kg", category: "Food", price: 1400, img: u("1504674900247-0877df9cc836"), tags: ["honey", "organic"] },
  { name: "Dry Fruits Box", category: "Food", price: 3000, discountPrice: 2600, img: u("1504674900247-0877df9cc836"), tags: ["dryfruits", "gift"] },
  { name: "Herbal Shampoo", category: "Health", price: 750, img: u("1586495777744-4413f21062fa"), tags: ["shampoo", "herbal"] },
  { name: "Yoga Mat", category: "Health", price: 1900, img: u("1542291026-7eec264c27ff"), tags: ["yoga", "fitness"] },
  { name: "Kids Toy Car", category: "Toys", price: 900, img: u("1441986300917-64674bd600d8"), tags: ["toy", "kids"] },
  { name: "Novel: Peer-e-Kamil", category: "Books", price: 800, img: u("1512820790803-83ca734da794"), tags: ["book", "novel"] },
];

async function run() {
  await connectDB();

  const stores = await Store.find({ status: "active", showInSearch: true });
  if (stores.length === 0) {
    console.log("No searchable active stores found. Run `npm run seed` first.");
    await mongoose.disconnect();
    return;
  }

  const lahoreStore = stores.find((s) => s.city === "Lahore") ?? stores[0]!;

  const docs = PRODUCTS.map((p, i) => {
    // First 5 go to a Lahore store; the rest round-robin across all stores.
    const store = i < 5 ? lahoreStore : stores[i % stores.length]!;
    const base = CITY_COORDS[store.city] ?? CITY_COORDS.Lahore!;
    return {
      storeId: store._id,
      name: p.name,
      category: p.category,
      price: p.price,
      discountPrice: p.discountPrice,
      images: [p.img],
      tags: p.tags,
      description: `${p.name} — quality ${p.category.toLowerCase()} available now.`,
      stockStatus: "in_stock" as const,
      status: "active" as const,
      negotiable: false,
      condition: "new" as const,
      deliveryOption: "available" as const,
      lat: Number((base.lat + jitter()).toFixed(6)),
      lng: Number((base.lng + jitter()).toFixed(6)),
      moderationStatus: "approved" as const,
    };
  });

  const inserted = await Product.insertMany(docs);
  const lahoreCount = docs.filter((d) => lahoreStore && d.storeId === lahoreStore._id).length;
  console.log(`Added ${inserted.length} products (${lahoreCount} in Lahore).`);
  console.log("They now show on the homepage and respond to 'Near me'.");
  await mongoose.disconnect();
}

run().catch((err) => {
  console.error(err);
  process.exit(1);
});
