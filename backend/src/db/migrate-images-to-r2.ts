/**
 * Move every locally-stored image (./uploads) to Cloudflare R2 and rewrite the
 * `.../uploads/<file>` URLs saved in MongoDB to point at the R2 public URL.
 *
 * Covers product images, store logo/cover/hero, banner ads, payment proofs,
 * seller KYC CNIC photos and the image copied onto order items.
 *
 * Needs the R2_* variables in .env. Safe to re-run — URLs already on R2 are
 * left alone. Run on the server that holds the uploads folder:
 *   npm run migrate:r2 -- --dry-run   (only report what would change)
 *   npm run migrate:r2
 */
import path from "path";
import fs from "fs/promises";
import mongoose from "mongoose";
import { connectDB } from "./connect";
import { env } from "../config/env";
import { UPLOAD_DIR, putR2Object } from "../lib/storage";
import { Product } from "../models/Product";
import { Store } from "../models/Store";
import { Banner } from "../models/Banner";
import { PaymentRequest } from "../models/PaymentRequest";
import { Seller } from "../models/Seller";
import { Order } from "../models/Order";

const DRY_RUN = process.argv.includes("--dry-run");

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/** Matches any host's /uploads/<file> URL (localhost, old PUBLIC_URL, ...). */
const LOCAL_URL = /\/uploads\/([^/?#]+)$/;

const migrated = new Map<string, string>(); // filename -> R2 URL
const missing = new Set<string>();

/** Return the R2 URL for a local upload URL, uploading the file once. */
async function toR2(url: string | undefined | null): Promise<string | undefined | null> {
  const match = url?.match(LOCAL_URL);
  if (!url || !match) return url;
  const filename = decodeURIComponent(match[1]!);

  const cached = migrated.get(filename);
  if (cached) return cached;

  let body: Buffer;
  try {
    body = await fs.readFile(path.join(UPLOAD_DIR, filename));
  } catch {
    missing.add(filename);
    return url; // keep the old URL rather than break it
  }

  const contentType = MIME[path.extname(filename).toLowerCase()] ?? "application/octet-stream";
  const r2Url = DRY_RUN
    ? `${env.r2.publicUrl}/${filename}`
    : await putR2Object(filename, body, contentType);
  migrated.set(filename, r2Url);
  return r2Url;
}

/**
 * Rewrite the given string fields on every document of a collection. Works on
 * the raw collection so schema validation/hooks don't interfere.
 */
async function migrateFields(
  label: string,
  model: mongoose.Model<any>,
  fields: string[]
): Promise<void> {
  let changed = 0;
  const cursor = model.collection.find({}, { projection: Object.fromEntries(fields.map((f) => [f, 1])) });
  for await (const doc of cursor) {
    const set: Record<string, unknown> = {};
    for (const field of fields) {
      const value = doc[field];
      if (Array.isArray(value)) {
        const next = await Promise.all(value.map((v) => (typeof v === "string" ? toR2(v) : v)));
        if (next.some((v, i) => v !== value[i])) set[field] = next;
      } else if (typeof value === "string") {
        const next = await toR2(value);
        if (next !== value) set[field] = next;
      }
    }
    if (Object.keys(set).length > 0) {
      changed++;
      if (!DRY_RUN) await model.collection.updateOne({ _id: doc._id }, { $set: set });
    }
  }
  console.log(`  ${label}: ${changed} document(s) updated`);
}

/** Order items are embedded objects, so their image is handled separately. */
async function migrateOrders(): Promise<void> {
  let changed = 0;
  const cursor = Order.collection.find({ "items.image": LOCAL_URL }, { projection: { items: 1 } });
  for await (const doc of cursor) {
    const items = await Promise.all(
      (doc.items as Array<{ image?: string }>).map(async (item) => ({ ...item, image: await toR2(item.image) }))
    );
    changed++;
    if (!DRY_RUN) await Order.collection.updateOne({ _id: doc._id }, { $set: { items } });
  }
  console.log(`  Orders: ${changed} document(s) updated`);
}

async function migrate(): Promise<void> {
  if (!env.r2Enabled) {
    throw new Error("R2 is not configured — set the R2_* variables in .env first.");
  }
  await connectDB();
  console.log(`Migrating images from ${UPLOAD_DIR} to ${env.r2.publicUrl}${DRY_RUN ? " (dry run)" : ""}`);

  await migrateFields("Products", Product, ["images"]);
  await migrateFields("Stores", Store, ["logoUrl", "coverUrl", "heroImageUrl"]);
  await migrateFields("Banners", Banner, ["imageUrl"]);
  await migrateFields("Payment requests", PaymentRequest, ["proofUrl"]);
  await migrateFields("Sellers (KYC)", Seller, ["kycCnicFront", "kycCnicBack"]);
  await migrateOrders();

  console.log(`\n${migrated.size} file(s) ${DRY_RUN ? "would be" : ""} uploaded to R2.`);
  if (missing.size > 0) {
    console.warn(`${missing.size} file(s) referenced in the DB were not found in ${UPLOAD_DIR} (URLs left unchanged):`);
    for (const f of missing) console.warn(`  - ${f}`);
  }
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error(err);
  process.exit(1);
});
