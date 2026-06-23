import type { Request, Response } from "express";
import { z } from "zod";
import { Seller } from "../models/Seller";
import { Store } from "../models/Store";
import { Product } from "../models/Product";
import { getPlan } from "../lib/plans";
import { moderateProduct } from "../lib/moderation";
import { ApiError, asyncHandler, slugify } from "../lib/helpers";

/** Resolve the authenticated seller or throw. */
async function currentSeller(req: Request) {
  const seller = await Seller.findById(req.user!.id);
  if (!seller) throw new ApiError(404, "Seller not found");
  return seller;
}

/* --------------------------------- Profile -------------------------------- */

export const getMe = asyncHandler(async (req: Request, res: Response) => {
  const seller = await currentSeller(req);
  res.json(seller.toJSON());
});

export const getMyStore = asyncHandler(async (req: Request, res: Response) => {
  const seller = await currentSeller(req);
  const store = seller.storeId ? await Store.findById(seller.storeId) : null;
  res.json(store ? store.toJSON() : null);
});

const storeSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(1),
  category: z.string().min(1),
  whatsapp: z.string().min(6),
  city: z.string().min(1),
  area: z.string().optional(),
  fullAddress: z.string().optional(),
  mapsLink: z.string().url().optional().or(z.literal("")),
  logoUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  showLocation: z.boolean().optional(),
  showInSearch: z.boolean().optional(),
  socials: z
    .object({
      instagram: z.string().optional(),
      facebook: z.string().optional(),
      tiktok: z.string().optional(),
    })
    .optional(),
  deliveryInfo: z.string().optional(),
  paymentInfo: z.string().optional(),
});

/** Generate a slug unique across stores (excluding the seller's own store). */
async function uniqueSlug(base: string, ownStoreId?: string): Promise<string> {
  const root = slugify(base) || "shop";
  let candidate = root;
  let n = 1;
  // eslint-disable-next-line no-await-in-loop
  while (await Store.exists({ slug: candidate, _id: { $ne: ownStoreId } })) {
    candidate = `${root}-${n++}`;
  }
  return candidate;
}

/** PUT /api/seller/store — create or update the seller's store profile. */
export const upsertStore = asyncHandler(async (req: Request, res: Response) => {
  const seller = await currentSeller(req);
  const data = storeSchema.parse(req.body);

  let store = seller.storeId ? await Store.findById(seller.storeId) : null;

  if (!store) {
    const slug = await uniqueSlug(data.name);
    store = await Store.create({ ...data, sellerId: seller._id, slug });
    seller.storeId = store._id as typeof seller.storeId;
    await seller.save();
  } else {
    Object.assign(store, data);
    // Keep slug stable unless the store has none yet.
    if (!store.slug) store.slug = await uniqueSlug(data.name, store.id);
    await store.save();
  }

  res.json(store.toJSON());
});

const landingSchema = z.object({
  enabled: z.boolean(),
  theme: z.enum(["brand", "emerald", "rose", "amber", "dark"]),
  headline: z.string().optional(),
  tagline: z.string().optional(),
  heroImageUrl: z.string().optional(),
  primaryCtaLabel: z.string().optional(),
  showFeatured: z.boolean(),
  featuredProductIds: z.array(z.string()).default([]),
  showAbout: z.boolean(),
  aboutTitle: z.string().optional(),
  aboutText: z.string().optional(),
  showContact: z.boolean(),
});

/** PATCH /api/seller/store/landing — save the landing page config. */
export const updateStoreLanding = asyncHandler(async (req: Request, res: Response) => {
  const seller = await currentSeller(req);
  if (!seller.storeId) throw new ApiError(400, "Create your store profile first");
  const store = await Store.findById(seller.storeId);
  if (!store) throw new ApiError(404, "Store not found");

  store.landing = landingSchema.parse(req.body);
  await store.save();
  res.json(store.toJSON());
});

const stripeSchema = z.object({
  connected: z.boolean(),
  accountId: z.string().optional(),
  email: z.string().optional(),
});

/** PATCH /api/seller/store/payment — connect/update the store's Stripe payment method. */
export const updateStorePayment = asyncHandler(async (req: Request, res: Response) => {
  const seller = await currentSeller(req);
  if (!seller.storeId) throw new ApiError(400, "Create your store profile first");
  const store = await Store.findById(seller.storeId);
  if (!store) throw new ApiError(404, "Store not found");

  store.stripe = stripeSchema.parse(req.body);
  await store.save();
  res.json(store.toJSON());
});

const planSchema = z.object({
  planId: z.enum(["starter", "basic", "growth", "pro"]),
});

/**
 * PATCH /api/seller/plan — seller switches their own plan.
 * (In production this would be gated behind a payment; for now it applies
 * immediately and marks the subscription active.)
 */
export const changePlan = asyncHandler(async (req: Request, res: Response) => {
  const seller = await currentSeller(req);
  const { planId } = planSchema.parse(req.body);
  seller.planId = planId;
  seller.subscriptionStatus = "active";
  await seller.save();
  res.json(seller.toJSON());
});

/* --------------------------------- Products ------------------------------- */

const productSchema = z.object({
  name: z.string().min(1),
  category: z.string().min(1),
  price: z.number().nonnegative(),
  discountPrice: z.number().nonnegative().optional(),
  images: z.array(z.string()).default([]),
  videoUrl: z.string().optional(),
  description: z.string().optional(),
  tags: z.array(z.string()).default([]),
  stockStatus: z.enum(["in_stock", "out_of_stock"]).default("in_stock"),
  status: z.enum(["active", "inactive"]).default("active"),
  negotiable: z.boolean().default(false),
  condition: z.enum(["new", "used"]).optional(),
  deliveryAvailable: z.boolean().optional(),
});

async function requireOwnedStore(req: Request) {
  const seller = await currentSeller(req);
  if (!seller.storeId) throw new ApiError(400, "Create your store profile first");
  const store = await Store.findById(seller.storeId);
  if (!store) throw new ApiError(404, "Store not found");
  return { seller, store };
}

export const getMyProducts = asyncHandler(async (req: Request, res: Response) => {
  const seller = await currentSeller(req);
  if (!seller.storeId) return res.json([]);
  const products = await Product.find({ storeId: seller.storeId }).sort({ createdAt: -1 });
  res.json(products.map((p) => p.toJSON()));
});

/** Validate the payload against the seller's plan limits (SRS §6). */
function enforcePlanLimits(
  planId: Parameters<typeof getPlan>[0],
  data: z.infer<typeof productSchema>
) {
  const plan = getPlan(planId);
  if (data.images.length > plan.imageLimit) {
    throw new ApiError(
      403,
      `Your ${plan.name} plan allows up to ${plan.imageLimit} image(s) per product.`
    );
  }
  if (data.videoUrl && plan.videoLimit < 1) {
    throw new ApiError(403, `Your ${plan.name} plan does not allow product videos.`);
  }
}

/** POST /api/seller/products — add a product (plan limits + moderation). */
export const createProduct = asyncHandler(async (req: Request, res: Response) => {
  const { seller, store } = await requireOwnedStore(req);
  const data = productSchema.parse(req.body);

  const plan = getPlan(seller.planId);
  const count = await Product.countDocuments({ storeId: store._id });
  if (count >= plan.productLimit) {
    throw new ApiError(
      403,
      `Your ${plan.name} plan allows up to ${plan.productLimit} products. Upgrade to add more.`
    );
  }
  enforcePlanLimits(seller.planId, data);

  const moderation = moderateProduct(data);
  const product = await Product.create({
    ...data,
    storeId: store._id,
    moderationStatus: moderation.status,
    moderationReason: moderation.reason,
  });

  res.status(201).json(product.toJSON());
});

/** PUT /api/seller/products/:id — edit a product (ownership + re-moderation). */
export const updateProduct = asyncHandler(async (req: Request, res: Response) => {
  const { seller, store } = await requireOwnedStore(req);
  const data = productSchema.parse(req.body);
  enforcePlanLimits(seller.planId, data);

  const product = await Product.findOne({ _id: req.params.id, storeId: store._id });
  if (!product) throw new ApiError(404, "Product not found");

  const moderation = moderateProduct(data);
  Object.assign(product, data, {
    moderationStatus: moderation.status,
    moderationReason: moderation.reason,
  });
  await product.save();

  res.json(product.toJSON());
});

/** DELETE /api/seller/products/:id — remove a product (ownership checked). */
export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { store } = await requireOwnedStore(req);
  const product = await Product.findOneAndDelete({ _id: req.params.id, storeId: store._id });
  if (!product) throw new ApiError(404, "Product not found");
  res.json({ ok: true });
});

/* -------------------------------- Dashboard ------------------------------- */

/** GET /api/seller/dashboard — aggregated metrics (SRS §5.2 / §11). */
export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  const seller = await currentSeller(req);
  const plan = getPlan(seller.planId);
  const store = seller.storeId ? await Store.findById(seller.storeId) : null;
  const products = store ? await Product.find({ storeId: store._id }) : [];

  res.json({
    productsUsed: products.length,
    productLimit: plan.productLimit,
    totalProducts: products.length,
    activeProducts: products.filter((p) => p.status === "active").length,
    outOfStockProducts: products.filter((p) => p.stockStatus === "out_of_stock").length,
    shopViews: store?.views ?? 0,
    productViews: products.reduce((sum, p) => sum + p.views, 0),
    whatsappClicks: store?.whatsappClicks ?? 0,
  });
});
