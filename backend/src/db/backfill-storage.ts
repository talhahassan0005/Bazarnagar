/**
 * Backfill the upload log (per-store storage usage) for images uploaded
 * before upload logging existed — WITHOUT changing any store or product.
 *
 * Finds every R2 / local-uploads image referenced by a seller (KYC), their
 * store (logo, cover, landing hero) and products, reads each file's real size
 * from R2 or disk, and records it against that seller. Banner ad images are
 * recorded as admin uploads. Safe to re-run: files already logged are skipped.
 *
 * Run with: `npm run backfill:storage`.
 */
import path from "path";
import fs from "fs/promises";
import mongoose from "mongoose";
import { connectDB } from "./connect";
import { env } from "../config/env";
import { UPLOAD_DIR, headR2Object } from "../lib/storage";
import { UploadLog } from "../models/UploadLog";
import { Seller } from "../models/Seller";
import { Store } from "../models/Store";
import { Product } from "../models/Product";
import { Banner } from "../models/Banner";

const MIME: Record<string, string> = {
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".webp": "image/webp",
  ".gif": "image/gif",
};

/** Map an image URL to where we store it, or null for external links. */
function locate(url: string | undefined | null): { key: string; storage: "r2" | "local" } | null {
  if (!url) return null;
  if (env.r2.publicUrl && url.startsWith(`${env.r2.publicUrl}/`)) {
    return { key: decodeURIComponent(url.slice(env.r2.publicUrl.length + 1)), storage: "r2" };
  }
  const local = url.match(/\/uploads\/([^/?#]+)$/);
  return local ? { key: decodeURIComponent(local[1]!), storage: "local" } : null;
}

async function fileInfo(key: string, storage: "r2" | "local") {
  if (storage === "r2") return env.r2Enabled ? headR2Object(key) : null;
  try {
    const stat = await fs.stat(path.join(UPLOAD_DIR, key));
    return {
      size: stat.size,
      contentType: MIME[path.extname(key).toLowerCase()] ?? "application/octet-stream",
      lastModified: stat.mtime,
    };
  } catch {
    return null;
  }
}

async function backfill(): Promise<void> {
  await connectDB();
  const logged = new Set((await UploadLog.find({}, { key: 1 })).map((l) => l.key));

  // url -> owning seller (undefined = admin upload)
  const owners = new Map<string, mongoose.Types.ObjectId | undefined>();
  const sellers = await Seller.find().select("kycCnicFront kycCnicBack storeId");
  const sellerByStore = new Map(sellers.filter((s) => s.storeId).map((s) => [String(s.storeId), s._id]));
  for (const s of sellers) {
    for (const url of [s.kycCnicFront, s.kycCnicBack]) if (url) owners.set(url, s._id as mongoose.Types.ObjectId);
  }
  for (const store of await Store.find().select("logoUrl coverUrl landing.heroImageUrl")) {
    const sellerId = sellerByStore.get(store.id);
    if (!sellerId) continue;
    for (const url of [store.logoUrl, store.coverUrl, store.landing?.heroImageUrl]) if (url) owners.set(url, sellerId as mongoose.Types.ObjectId);
  }
  for await (const p of Product.find().select("storeId images")) {
    const sellerId = sellerByStore.get(String(p.storeId));
    if (!sellerId) continue;
    for (const url of p.images) owners.set(url, sellerId as mongoose.Types.ObjectId);
  }
  for (const b of await Banner.find().select("imageUrl")) {
    if (!owners.has(b.imageUrl)) owners.set(b.imageUrl, undefined);
  }

  let added = 0;
  let missing = 0;
  for (const [url, sellerId] of owners) {
    const where = locate(url);
    if (!where || logged.has(where.key)) continue;
    const info = await fileInfo(where.key, where.storage);
    if (!info) {
      missing++;
      continue;
    }
    const at = info.lastModified ?? new Date();
    // Raw insert keeps the file's original upload time as createdAt.
    await UploadLog.collection.insertOne({
      key: where.key,
      url,
      size: info.size,
      contentType: info.contentType,
      storage: where.storage,
      uploaderRole: sellerId ? "seller" : "admin",
      ...(sellerId ? { sellerId } : {}),
      backfilled: true,
      createdAt: at,
      updatedAt: at,
    });
    logged.add(where.key);
    added++;
  }

  console.log(`✓ Logged ${added} existing file(s).`);
  if (missing > 0) console.log(`  ${missing} referenced file(s) not found on this server's storage — skipped.`);
  await mongoose.disconnect();
}

backfill().catch((err) => {
  console.error(err);
  process.exit(1);
});
