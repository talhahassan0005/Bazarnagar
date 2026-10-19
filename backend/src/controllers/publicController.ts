import type { Request, Response } from "express";
import { Store } from "../models/Store";
import { Product, type ProductDoc } from "../models/Product";
import { asyncHandler } from "../lib/helpers";
import { ratingSummary } from "./reviewController";
import { withoutStats } from "../lib/publicJson";

/** Only products customers may see publicly (SRS §7). */
const PUBLIC_PRODUCT_FILTER = { status: "active", moderationStatus: "approved" } as const;

/** Sort actively-boosted (featured) products first, then newest. */
function boostFirst(a: ProductDoc, b: ProductDoc): number {
  const t = Date.now();
  const ab = a.boostedUntil ? a.boostedUntil.getTime() > t : false;
  const bb = b.boostedUntil ? b.boostedUntil.getTime() > t : false;
  if (ab !== bb) return ab ? -1 : 1;
  return b.createdAt.getTime() - a.createdAt.getTime();
}

/** GET /api/public/stores/:slug — public shop page. Increments shop views. */
export const getStoreBySlug = asyncHandler(async (req: Request, res: Response) => {
  const store = await Store.findOneAndUpdate(
    { slug: req.params.slug, status: "active" },
    { $inc: { views: 1 } },
    { new: true }
  );
  if (!store) return res.json(null);
  const { Seller } = await import("../models/Seller");
  const seller = await Seller.findById(store.sellerId).select("planId");
  res.json({ ...withoutStats(store.toJSON()), planId: seller?.planId ?? "starter" });
});

/**
 * Exact city match ignoring case/extra spaces, so a seller's typed-in
 * "mandi bahauddin" still matches the "Mandi Bahauddin" filter.
 */
function cityMatch(city: string) {
  const escaped = city.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return { $regex: `^\\s*${escaped}\\s*$`, $options: "i" };
}

/**
 * GET /api/public/cities — every city that has a live, searchable shop, so
 * filters include cities sellers typed in themselves ("Other").
 */
export const getCities = asyncHandler(async (_req: Request, res: Response) => {
  const raw: string[] = await Store.distinct("city", { status: "active", showInSearch: true });
  const byKey = new Map<string, string>();
  for (const c of raw) {
    const name = c?.trim();
    if (name && !byKey.has(name.toLowerCase())) byKey.set(name.toLowerCase(), name);
  }
  res.json([...byKey.values()].sort((a, b) => a.localeCompare(b)));
});

/** GET /api/public/stores — browse all public shops (optional q / city filter). */
export const getStores = asyncHandler(async (req: Request, res: Response) => {
  const q = (req.query.q as string | undefined)?.trim().toLowerCase();
  const city = req.query.city as string | undefined;

  const filter: Record<string, unknown> = { status: "active", showInSearch: true };
  if (city) filter.city = cityMatch(city);

  let stores = await Store.find(filter).sort({ views: -1 });
  if (q) {
    stores = stores.filter((s) =>
      [s.name, s.category, s.city, s.area ?? "", s.description]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }
  res.json(stores.map((s) => withoutStats(s.toJSON())));
});

/** GET /api/public/stores/:storeId/products — products for one store. */
export const getStoreProducts = asyncHandler(async (req: Request, res: Response) => {
  const publicOnly = req.query.publicOnly === "true";
  const filter: Record<string, unknown> = { storeId: req.params.storeId };
  if (publicOnly) Object.assign(filter, PUBLIC_PRODUCT_FILTER);
  const products = await Product.find(filter).sort({ createdAt: -1 });
  products.sort(boostFirst);
  res.json(products.map((p) => withoutStats(p.toJSON())));
});

/**
 * GET /api/public/products/:id — product detail. Counts a view, except when
 * the product's own seller or an admin opens it (so checks don't inflate stats).
 */
export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findById(req.params.id);
  if (!product) return res.json(null);
  const store = await Store.findById(product.storeId);

  // Unapproved/inactive products are only visible to their own seller or an
  // admin (e.g. previewing/editing before approval) — never to the public,
  // so a stray direct link can't expose a rejected/pending listing.
  const isPublic = product.status === "active" && product.moderationStatus === "approved";
  const isOwner = req.user?.role === "seller" && store?.sellerId.toString() === req.user.id;
  const isAdmin = req.user?.role === "admin";
  if (!isPublic && !isOwner && !isAdmin) return res.json(null);

  if (!isOwner && !isAdmin) {
    await Product.updateOne({ _id: product._id }, { $inc: { views: 1 } });
    product.views += 1;
  }

  const rating = await ratingSummary(product._id as Parameters<typeof ratingSummary>[0]);
  // View/click counts are only for the product's own seller and admins.
  const productJson = isOwner || isAdmin ? product.toJSON() : withoutStats(product.toJSON());
  res.json({ ...productJson, store: store ? withoutStats(store.toJSON()) : null, rating });
});

/**
 * GET /api/public/products/:id/related — other public products in the same
 * category, from any store that's live in search. Boosted products first.
 */
export const getRelatedProducts = asyncHandler(async (req: Request, res: Response) => {
  const limit = Math.min(Math.max(Number(req.query.limit) || 12, 1), 24);
  const product = await Product.findById(req.params.id).select("category");
  if (!product) return res.json([]);

  // Over-fetch, then drop products whose store is hidden or inactive.
  const candidates = await Product.find({
    ...PUBLIC_PRODUCT_FILTER,
    category: product.category,
    _id: { $ne: product._id },
  })
    .sort({ createdAt: -1 })
    .limit(limit * 4);

  const stores = await Store.find({
    _id: { $in: [...new Set(candidates.map((p) => p.storeId.toString()))] },
    status: "active",
    showInSearch: true,
  });
  const storeById = new Map(stores.map((s) => [s.id, s]));

  const related = candidates
    .filter((p) => storeById.has(p.storeId.toString()))
    .sort(boostFirst)
    .slice(0, limit);

  res.json(
    related.map((p) => ({
      ...withoutStats(p.toJSON()),
      store: withoutStats(storeById.get(p.storeId.toString())!.toJSON()),
    }))
  );
});

/** GET /api/public/search — keyword + category/city/area search (SRS §9). */
export const searchProducts = asyncHandler(async (req: Request, res: Response) => {
  const q = (req.query.q as string | undefined)?.trim();
  const category = req.query.category as string | undefined;
  const city = req.query.city as string | undefined;
  const area = req.query.area as string | undefined;

  // Find stores that are public-searchable and (optionally) match city/area.
  const storeFilter: Record<string, unknown> = { showInSearch: true, status: "active" };
  if (city) storeFilter.city = cityMatch(city);
  if (area) storeFilter.area = area;
  const stores = await Store.find(storeFilter);
  const storeById = new Map(stores.map((s) => [s.id, s]));

  const productFilter: Record<string, unknown> = {
    ...PUBLIC_PRODUCT_FILTER,
    storeId: { $in: stores.map((s) => s._id) },
  };
  if (category) productFilter.category = category;

  let products = await Product.find(productFilter).sort({ createdAt: -1 });

  // Keyword match across product + store fields (SRS §9 searchable fields).
  if (q) {
    const needle = q.toLowerCase();
    products = products.filter((p) => {
      const store = storeById.get(p.storeId.toString());
      const haystack = [
        p.name,
        p.description ?? "",
        p.category,
        p.tags.join(" "),
        store?.name ?? "",
        store?.city ?? "",
        store?.area ?? "",
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }

  products.sort(boostFirst);
  res.json(
    products.map((p) => {
      const store = storeById.get(p.storeId.toString());
      return { ...withoutStats(p.toJSON()), store: store ? withoutStats(store.toJSON()) : null };
    })
  );
});

/** POST /api/public/products/:id/whatsapp-click — track an inquiry click. */
export const trackWhatsappClick = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $inc: { whatsappClicks: 1 } },
    { new: true }
  );
  if (product) {
    await Store.findByIdAndUpdate(product.storeId, { $inc: { whatsappClicks: 1 } });
  }
  res.json({ ok: true });
});
