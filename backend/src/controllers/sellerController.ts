import type { Request, Response } from "express";
import { z } from "zod";
import { Seller } from "../models/Seller";
import { Store } from "../models/Store";
import { Product } from "../models/Product";
import { Payment } from "../models/Payment";
import { getPlan, addBillingPeriod } from "../lib/plans";
import { getBoostPackage } from "../lib/boost";
import { moderateProduct } from "../lib/moderation";
import { safepayEnabled, createSafepaySession, verifyReturnSignature } from "../lib/safepay";
import { env } from "../config/env";
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
  lat: z.number().optional(),
  lng: z.number().optional(),
  logoUrl: z.string().optional(),
  coverUrl: z.string().optional(),
  showLocation: z.boolean().optional(),
  showInSearch: z.boolean().optional(),
  isOpen: z.boolean().optional(),
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

const payoutSchema = z.object({
  method: z.enum(["easypaisa", "jazzcash", "bank"]),
  accountTitle: z.string().min(2, "Account title is required"),
  accountNumber: z.string().min(4, "Account number is required"),
  bankName: z.string().optional(),
});

/** PATCH /api/seller/store/payout — set where the seller receives their money. */
export const updateStorePayout = asyncHandler(async (req: Request, res: Response) => {
  const seller = await currentSeller(req);
  if (!seller.storeId) throw new ApiError(400, "Create your store profile first");
  const store = await Store.findById(seller.storeId);
  if (!store) throw new ApiError(404, "Store not found");

  const data = payoutSchema.parse(req.body);
  // Valid details saved → mark the payout account connected.
  store.payout = { ...data, connectedAt: new Date() };
  await store.save();
  res.json(store.toJSON());
});

const planSchema = z.object({
  planId: z.enum(["starter", "basic", "growth", "pro"]),
});

/**
 * PATCH /api/seller/plan — seller switches (subscribes to) a plan.
 * (In production this would be gated behind a payment; for now it applies
 * immediately, starts a fresh billing period, and marks the subscription
 * active.)
 */
export const changePlan = asyncHandler(async (req: Request, res: Response) => {
  const seller = await currentSeller(req);
  const { planId } = planSchema.parse(req.body);
  const now = new Date();
  const wasInactive =
    seller.subscriptionStatus === "expired" || seller.subscriptionStatus === "cancelled";

  seller.planId = planId;
  seller.subscriptionStatus = "active";
  seller.subscriptionStartedAt = now;
  seller.subscriptionEndsAt = addBillingPeriod(now);
  await seller.save();

  // Reactivate a store that was hidden when the subscription lapsed.
  if (wasInactive && seller.storeId) {
    await Store.updateOne({ _id: seller.storeId, status: "inactive" }, { status: "active" });
  }
  res.json(seller.toJSON());
});

/**
 * POST /api/seller/subscription/renew — renew the current plan for another
 * billing cycle (extends from the later of now / current expiry).
 */
export const renewSubscription = asyncHandler(async (req: Request, res: Response) => {
  const seller = await currentSeller(req);
  const now = new Date();
  const wasInactive =
    seller.subscriptionStatus === "expired" || seller.subscriptionStatus === "cancelled";
  const base =
    seller.subscriptionEndsAt && seller.subscriptionEndsAt > now ? seller.subscriptionEndsAt : now;

  seller.subscriptionStartedAt = seller.subscriptionStartedAt ?? now;
  seller.subscriptionEndsAt = addBillingPeriod(base);
  seller.subscriptionStatus = "active";
  await seller.save();

  if (wasInactive && seller.storeId) {
    await Store.updateOne({ _id: seller.storeId, status: "inactive" }, { status: "active" });
  }
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
  lat: z.number().optional(),
  lng: z.number().optional(),
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

const boostSchema = z.object({ packageId: z.string().min(1) });

/** POST /api/seller/products/:id/boost — feature a product (paid plans only). */
export const boostProduct = asyncHandler(async (req: Request, res: Response) => {
  const { seller, store } = await requireOwnedStore(req);
  if (seller.planId === "starter") {
    throw new ApiError(403, "Boosting is a paid feature. Upgrade your plan to feature products.");
  }
  const { packageId } = boostSchema.parse(req.body);
  const pkg = getBoostPackage(packageId);
  if (!pkg) throw new ApiError(400, "Invalid boost package");

  const product = await Product.findOne({ _id: req.params.id, storeId: store._id });
  if (!product) throw new ApiError(404, "Product not found");

  // Extend from the later of now / current expiry (stacking boosts).
  const now = new Date();
  const base = product.boostedUntil && product.boostedUntil > now ? product.boostedUntil : now;
  product.boostedUntil = new Date(base.getTime() + pkg.days * 24 * 60 * 60 * 1000);
  await product.save();
  res.json(product.toJSON());
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

/* --------------------------- Subscription / Payments ---------------------- */

const checkoutSchema = z.object({
  planId: z.enum(["starter", "basic", "growth", "pro"]),
});

/**
 * POST /api/seller/subscription/checkout
 * Initiate a Safepay payment for a plan subscription / renewal.
 * In mock mode returns a local test-gateway URL.
 */
export const subscriptionCheckout = asyncHandler(async (req: Request, res: Response) => {
  const seller = await currentSeller(req);
  const { planId } = checkoutSchema.parse(req.body);
  const plan = getPlan(planId);

  if (!safepayEnabled) {
    throw new ApiError(503, "Payment gateway is not configured. Please contact support.");
  }

  const url = await createSafepaySession({
    amount: plan.price,
    orderId: `sub_${seller.id}_${planId}_${Date.now()}`,
    redirectUrl: `${env.publicUrl}/api/seller/subscription/callback?seller=${seller.id}&plan=${planId}`,
    cancelUrl: `${env.appUrl}/dashboard/plan?payment=cancelled`,
  });
  res.json({ url });
});

/**
 * GET /api/seller/subscription/callback
 * Safepay redirects here (browser redirect) — responds with redirect.
 * When called via fetch (mock gateway) with ?json=1, responds with JSON.
 */
export const subscriptionCallback = asyncHandler(async (req: Request, res: Response) => {
  const sellerId = req.query.seller as string;
  const planId = req.query.plan as string;
  const tracker = req.query.tracker as string | undefined;
  const sig = req.query.sig as string | undefined;

  const fail = () => res.redirect(`${env.appUrl}/dashboard/plan?payment=failed`);

  if (!sellerId || !planId) return fail();

  // Verify Safepay return signature
  if (!verifyReturnSignature(tracker, sig)) return fail();

  const seller = await Seller.findById(sellerId);
  if (!seller) return fail();

  const plan = getPlan(planId as Parameters<typeof getPlan>[0]);
  const now = new Date();
  const wasInactive = seller.subscriptionStatus === "expired" || seller.subscriptionStatus === "cancelled";
  const base = seller.subscriptionEndsAt && seller.subscriptionEndsAt > now ? seller.subscriptionEndsAt : now;

  seller.planId = planId as typeof seller.planId;
  seller.subscriptionStatus = "active";
  seller.subscriptionStartedAt = seller.subscriptionStartedAt ?? now;
  seller.subscriptionEndsAt = addBillingPeriod(base);
  seller.autoRenew = false;
  await seller.save();

  await Payment.create({
    sellerId: seller._id,
    planId,
    amount: plan.price,
    method: "card",
    paidAt: now,
    notes: "Subscription via Safepay",
  });

  if (wasInactive && seller.storeId) {
    await Store.updateOne({ _id: seller.storeId, status: "inactive" }, { status: "active" });
  }

  res.redirect(`${env.appUrl}/dashboard/plan?payment=success`);
});

/** GET /api/seller/payments — seller's own payment history. */
export const getMyPayments = asyncHandler(async (req: Request, res: Response) => {
  const seller = await currentSeller(req);
  const payments = await Payment.find({ sellerId: seller._id }).sort({ paidAt: -1 });
  res.json(payments.map((p) => p.toJSON()));
});

/** GET /api/seller/subscription/status — current subscription details. */
export const getSubscriptionStatus = asyncHandler(async (req: Request, res: Response) => {
  const seller = await currentSeller(req);
  const now = new Date();
  const endsAt = seller.subscriptionEndsAt;
  const daysRemaining = endsAt
    ? Math.max(0, Math.ceil((endsAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  res.json({
    planId: seller.planId,
    subscriptionStatus: seller.subscriptionStatus,
    subscriptionEndsAt: endsAt ?? null,
    autoRenew: seller.autoRenew,
    daysRemaining,
    hasCardToken: Boolean(seller.safepayCardToken),
  });
});

/** POST /api/seller/subscription/toggle-auto-renew — flip autoRenew flag. */
export const toggleAutoRenew = asyncHandler(async (req: Request, res: Response) => {
  const seller = await currentSeller(req);
  seller.autoRenew = !seller.autoRenew;
  await seller.save();
  res.json({ autoRenew: seller.autoRenew });
});

/** POST /api/seller/subscription/cancel — cancel at period end. */
export const cancelSubscription = asyncHandler(async (req: Request, res: Response) => {
  const seller = await currentSeller(req);
  seller.autoRenew = false;
  // Keep status active until endDate — scheduler will expire it
  if (seller.subscriptionStatus === "active" || seller.subscriptionStatus === "trial") {
    seller.subscriptionStatus = "cancelled";
  }
  await seller.save();
  res.json({ ok: true, subscriptionStatus: seller.subscriptionStatus, subscriptionEndsAt: seller.subscriptionEndsAt });
});
