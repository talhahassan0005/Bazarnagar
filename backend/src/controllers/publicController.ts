import type { Request, Response } from "express";
import { Store } from "../models/Store";
import { Product } from "../models/Product";
import { asyncHandler } from "../lib/helpers";
import { ratingSummary } from "./reviewController";

/** Only products customers may see publicly (SRS §7). */
const PUBLIC_PRODUCT_FILTER = { status: "active", moderationStatus: "approved" } as const;

/** GET /api/public/stores/:slug — public shop page. Increments shop views. */
export const getStoreBySlug = asyncHandler(async (req: Request, res: Response) => {
  const store = await Store.findOneAndUpdate(
    { slug: req.params.slug, status: "active" },
    { $inc: { views: 1 } },
    { new: true }
  );
  res.json(store ? store.toJSON() : null);
});

/** GET /api/public/stores — browse all public shops (optional q / city filter). */
export const getStores = asyncHandler(async (req: Request, res: Response) => {
  const q = (req.query.q as string | undefined)?.trim().toLowerCase();
  const city = req.query.city as string | undefined;

  const filter: Record<string, unknown> = { status: "active", showInSearch: true };
  if (city) filter.city = city;

  let stores = await Store.find(filter).sort({ views: -1 });
  if (q) {
    stores = stores.filter((s) =>
      [s.name, s.category, s.city, s.area ?? "", s.description]
        .join(" ")
        .toLowerCase()
        .includes(q)
    );
  }
  res.json(stores.map((s) => s.toJSON()));
});

/** GET /api/public/stores/:storeId/products — products for one store. */
export const getStoreProducts = asyncHandler(async (req: Request, res: Response) => {
  const publicOnly = req.query.publicOnly === "true";
  const filter: Record<string, unknown> = { storeId: req.params.storeId };
  if (publicOnly) Object.assign(filter, PUBLIC_PRODUCT_FILTER);
  const products = await Product.find(filter).sort({ createdAt: -1 });
  res.json(products.map((p) => p.toJSON()));
});

/** GET /api/public/products/:id — product detail. Increments product views. */
export const getProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { $inc: { views: 1 } },
    { new: true }
  );
  if (!product) return res.json(null);
  const store = await Store.findById(product.storeId);
  const rating = await ratingSummary(product._id as Parameters<typeof ratingSummary>[0]);
  res.json({ ...product.toJSON(), store: store?.toJSON() ?? null, rating });
});

/** GET /api/public/search — keyword + category/city/area search (SRS §9). */
export const searchProducts = asyncHandler(async (req: Request, res: Response) => {
  const q = (req.query.q as string | undefined)?.trim();
  const category = req.query.category as string | undefined;
  const city = req.query.city as string | undefined;
  const area = req.query.area as string | undefined;

  // Find stores that are public-searchable and (optionally) match city/area.
  const storeFilter: Record<string, unknown> = { showInSearch: true, status: "active" };
  if (city) storeFilter.city = city;
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

  res.json(
    products.map((p) => ({
      ...p.toJSON(),
      store: storeById.get(p.storeId.toString())?.toJSON() ?? null,
    }))
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
