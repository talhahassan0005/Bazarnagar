/**
 * Backfill the admin activity log for stores, products and buyers that existed before
 * logging was added — WITHOUT wiping any data.
 *
 * Each log entry gets the store's/product's/buyer's original createdAt, so the admin
 * timeline shows them in the right order. Safe to re-run: anything that
 * already has a log entry is skipped.
 *
 * Run with: `npm run backfill:activity`.
 */
import mongoose from "mongoose";
import { connectDB } from "./connect";
import { ActivityLog } from "../models/ActivityLog";
import { Seller } from "../models/Seller";
import { Store } from "../models/Store";
import { Product } from "../models/Product";
import { Customer } from "../models/Customer";

async function backfill(): Promise<void> {
  await connectDB();

  const [sellers, stores, logged] = await Promise.all([
    Seller.find(),
    Store.find(),
    ActivityLog.find({}, { type: 1, storeId: 1, productId: 1, customerId: 1 }),
  ]);
  const sellerById = new Map(sellers.map((s) => [s.id, s]));
  const storeById = new Map(stores.map((s) => [s.id, s]));
  const loggedStores = new Set(
    logged.filter((l) => l.type === "store.created").map((l) => l.storeId?.toString())
  );
  const loggedProducts = new Set(logged.map((l) => l.productId?.toString()).filter(Boolean));
  const loggedBuyers = new Set(logged.map((l) => l.customerId?.toString()).filter(Boolean));

  const entries: Record<string, unknown>[] = [];

  for (const store of stores) {
    if (loggedStores.has(store.id)) continue;
    const seller = sellerById.get(store.sellerId?.toString());
    entries.push({
      type: "store.created",
      sellerId: store.sellerId,
      storeId: store._id,
      snapshot: {
        sellerName: seller?.name,
        sellerEmail: seller?.email,
        storeName: store.name,
        storeSlug: store.slug,
        city: store.city,
        category: store.category,
      },
      createdAt: store.get("createdAt"),
      updatedAt: store.get("createdAt"),
    });
  }

  for await (const product of Product.find()) {
    if (loggedProducts.has(product.id)) continue;
    const store = storeById.get(product.storeId.toString());
    const seller = store ? sellerById.get(store.sellerId?.toString()) : undefined;
    entries.push({
      type: "product.created",
      sellerId: store?.sellerId,
      storeId: product.storeId,
      productId: product._id,
      snapshot: {
        sellerName: seller?.name,
        sellerEmail: seller?.email,
        storeName: store?.name,
        storeSlug: store?.slug,
        city: store?.city,
        category: product.category,
        productName: product.name,
        price: product.price,
      },
      createdAt: product.createdAt,
      updatedAt: product.createdAt,
    });
  }

  for await (const customer of Customer.find()) {
    if (loggedBuyers.has(customer.id)) continue;
    entries.push({
      type: "buyer.registered",
      customerId: customer._id,
      snapshot: { buyerName: customer.name, buyerEmail: customer.email },
      createdAt: customer.createdAt,
      updatedAt: customer.createdAt,
    });
  }

  // Raw insert keeps the original createdAt instead of stamping "now".
  if (entries.length > 0) await ActivityLog.collection.insertMany(entries);
  console.log(`✓ Added ${entries.length} activity log entr${entries.length === 1 ? "y" : "ies"}.`);
  await mongoose.disconnect();
}

backfill().catch((err) => {
  console.error(err);
  process.exit(1);
});
