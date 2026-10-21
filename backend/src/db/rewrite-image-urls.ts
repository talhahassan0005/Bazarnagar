/**
 * Point every stored image link at a new public base URL — e.g. after the
 * images were copied to another R2 bucket (`npm run copy:r2`). Only the start
 * of matching links changes; the file names stay the same.
 *
 * Dry run by default (only counts). Add --apply to write the changes:
 *   npm run rewrite:image-urls -- --from https://pub-OLD.r2.dev --to https://pub-NEW.r2.dev
 *   npm run rewrite:image-urls -- --from https://pub-OLD.r2.dev --to https://pub-NEW.r2.dev --apply
 *
 * Covers product images, store logo/cover/landing hero, banner ads, payment
 * proofs, seller KYC photos, order item images and the storage upload log.
 */
import mongoose from "mongoose";
import { connectDB } from "./connect";

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

const from = arg("--from")?.replace(/\/$/, "");
const to = arg("--to")?.replace(/\/$/, "");
const APPLY = process.argv.includes("--apply");

/** collection -> string fields (or arrays of strings) holding image URLs */
const FIELDS: Record<string, string[]> = {
  products: ["images"],
  stores: ["logoUrl", "coverUrl", "landing.heroImageUrl"],
  banners: ["imageUrl"],
  paymentrequests: ["proofUrl"],
  sellers: ["kycCnicFront", "kycCnicBack"],
  uploadlogs: ["url"],
};

const swap = (v: unknown) =>
  typeof v === "string" && v.startsWith(`${from}/`) ? `${to}${v.slice(from!.length)}` : v;

const get = (doc: Record<string, unknown>, path: string) =>
  path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], doc);

async function rewrite(): Promise<void> {
  if (!from || !to) throw new Error("Pass --from <old base URL> and --to <new base URL>.");
  if (from === to) throw new Error("--from and --to are the same.");
  await connectDB();
  const db = mongoose.connection.db!;
  console.log(`${APPLY ? "Rewriting" : "Dry run —"} ${from} -> ${to}`);

  let total = 0;
  for (const [coll, fields] of Object.entries(FIELDS)) {
    let changedDocs = 0;
    for await (const doc of db.collection(coll).find({})) {
      const set: Record<string, unknown> = {};
      for (const field of fields) {
        const value = get(doc, field);
        const next = Array.isArray(value) ? value.map(swap) : swap(value);
        if (JSON.stringify(next) !== JSON.stringify(value)) set[field] = next;
      }
      if (Object.keys(set).length > 0) {
        changedDocs++;
        if (APPLY) await db.collection(coll).updateOne({ _id: doc._id }, { $set: set });
      }
    }
    total += changedDocs;
    console.log(`  ${coll}: ${changedDocs} document(s)`);
  }

  // Order items are an array of objects with an `image` each.
  let orders = 0;
  for await (const doc of db.collection("orders").find({ "items.image": { $regex: `^${from.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}/` } })) {
    const items = (doc.items as Array<{ image?: string }>).map((i) => ({ ...i, image: swap(i.image) }));
    orders++;
    if (APPLY) await db.collection("orders").updateOne({ _id: doc._id }, { $set: { items } });
  }
  console.log(`  orders: ${orders} document(s)`);
  total += orders;

  console.log(`\n${APPLY ? "✓ Updated" : "Would update"} ${total} document(s).${APPLY ? "" : " Re-run with --apply to write."}`);
  await mongoose.disconnect();
}

rewrite().catch((err) => {
  console.error(err);
  process.exit(1);
});
