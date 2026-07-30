import type { Request, Response } from "express";
import { z } from "zod";
import { Seller } from "../models/Seller";
import { Store } from "../models/Store";
import { Product } from "../models/Product";
import { Payment } from "../models/Payment";
import { getPlan, addBillingPeriod } from "../lib/plans";
import { getBoostPackage } from "../lib/boost";
import { moderateProduct } from "../lib/moderation";
import { safepayEnabled, createSafepaySession, verifyReturnSignature, getTrackerOrderId } from "../lib/safepay";
import { env } from "../config/env";
import { ApiError, asyncHandler, slugify } from "../lib/helpers";

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

export const updateStorePayout = asyncHandler(async (req: Request, res: Response) => {
  const seller = await currentSeller(req);
  if (!seller.storeId) throw new ApiError(400, "Create your store profile first");
  const store = await Store.findById(seller.storeId);
  if (!store) throw new ApiError(404, "Store not found");

  const data = payoutSchema.parse(req.body);
  store.payout = { ...data, connectedAt: new Date() };
  await store.save();
  res.json(store.toJSON());
});

const planSchema = z.object({
  planId: z.enum(["starter", "basic", "growth", "pro"]),
});

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

  if (wasInactive && seller.storeId) {
    await Store.updateOne({ _id: seller.storeId, status: "inactive" }, { status: "active" });
  }
  res.json(seller.toJSON());
});

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

export const deleteProduct = asyncHandler(async (req: Request, res: Response) => {
  const { store } = await requireOwnedStore(req);
  const product = await Product.findOneAndDelete({ _id: req.params.id, storeId: store._id });
  if (!product) throw new ApiError(404, "Product not found");
  res.json({ ok: true });
});

const boostSchema = z.object({ packageId: z.string().min(1) });

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

  const now = new Date();
  const base = product.boostedUntil && product.boostedUntil > now ? product.boostedUntil : now;
  product.boostedUntil = new Date(base.getTime() + pkg.days * 24 * 60 * 60 * 1000);
  await product.save();
  res.json(product.toJSON());
});

/* -------------------------------- Dashboard ------------------------------- */

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

export const subscriptionCheckout = asyncHandler(async (req: Request, res: Response) => {
  const seller = await currentSeller(req);
  const { planId } = checkoutSchema.parse(req.body);
  const plan = getPlan(planId);

  if (!safepayEnabled) {
    throw new ApiError(503, "Payment gateway is not configured. Please contact support.");
  }

  const orderId = `sub_${seller.id}_${planId}_${Date.now()}`;
  const redirectUrl = `${env.publicUrl}/api/seller/subscription/callback?seller=${seller.id}&plan=${planId}`;

  console.log(`[subscription] checkout start sellerId=${seller.id} planId=${planId} orderId=${orderId} redirectUrl=${redirectUrl}`);

  const url = await createSafepaySession({
    amount: plan.price,
    orderId,
    redirectUrl,
    cancelUrl: `${env.appUrl}/dashboard/plan?payment=cancelled`,
  });

  console.log(`[subscription] checkout session created sellerId=${seller.id} orderId=${orderId}`);
  res.json({ url, orderId, planId });
});

/**
 * POST /api/seller/subscription/confirm
 * Frontend calls this after Safepay popup shows "Paid successfully".
 * Since Safepay sandbox does not redirect back to our domain, the frontend
 * detects the success page via postMessage and then calls this endpoint
 * with the orderId to activate the subscription.
 */
export const subscriptionConfirm = asyncHandler(async (req: Request, res: Response) => {
  const seller = await currentSeller(req);
  const { planId, tracker, sig } = z.object({
    planId: z.enum(["starter", "basic", "growth", "pro"]),
    tracker: z.string().min(1),
    sig: z.string().optional(),
  }).parse(req.body);

  console.log(`[subscription] confirm called sellerId=${seller.id} planId=${planId} tracker=${tracker}`);

  // Production: verify HMAC signature from Safepay redirect
  if (env.safepayEnv === "production" && !verifyReturnSignature(tracker, sig)) {
    console.error(`[subscription] confirm rejected — signature verification failed sellerId=${seller.id} tracker=${tracker}`);
    throw new ApiError(400, "Payment signature verification failed.");
  }
  // Sandbox: tracker is our orderId (sub_ prefix) — trust it since it's
  // authenticated (seller JWT required) and Safepay showed "Paid successfully"

  const plan = getPlan(planId);
  const now = new Date();

  seller.planId = planId;
  seller.subscriptionStatus = "active";
  seller.subscriptionStartedAt = now;
  seller.subscriptionEndsAt = addBillingPeriod(now);
  seller.autoRenew = false;
  await seller.save();

  await Payment.create({
    sellerId: seller._id,
    planId,
    amount: plan.price,
    method: "card",
    paidAt: now,
    notes: `Subscription via Safepay (${env.safepayEnv})`,
  });

  if (seller.storeId) {
    await Store.updateOne({ _id: seller.storeId }, { status: "active" });
  }

  console.log(`[subscription] confirm activated sellerId=${seller.id} planId=${planId} endsAt=${seller.subscriptionEndsAt?.toISOString()}`);
  res.json({ ok: true, seller: seller.toJSON() });
});

/**
 * GET /api/seller/subscription/callback
 * Safepay browser-redirect lands here (production). In sandbox this is
 * rarely hit — subscriptionConfirm is the primary activation path.
 */
export const subscriptionCallback = asyncHandler(async (req: Request, res: Response) => {
  const tracker = req.query.tracker as string | undefined;
  const sig = req.query.sig as string | undefined;

  console.log(`[subscription] callback hit query=${JSON.stringify(req.query)}`);

  const fail = (reason: string) => {
    console.error(`[subscription] callback failed: ${reason} query=${JSON.stringify(req.query)}`);
    return res.redirect(`${env.appUrl}/dashboard/plan?payment=failed`);
  };

  if (env.safepayEnv === "production" && !verifyReturnSignature(tracker, sig)) {
    return fail("signature verification failed");
  }

  // Step 1: try explicit query params (our redirectUrl)
  let sellerId = req.query.seller as string | undefined;
  let planIdRaw = req.query.plan as string | undefined;

  // Step 2: try order_id echoed by Safepay in query
  if (!sellerId || !planIdRaw) {
    const qOrderId = (req.query.order_id ?? req.query.orderId) as string | undefined;
    const m = qOrderId?.match(/^sub_([a-f0-9]+)_([a-z]+)_\d+$/i);
    if (m) { sellerId = m[1]; planIdRaw = m[2]; }
  }

  // Step 3: fetch order_id from Safepay API using tracker
  if ((!sellerId || !planIdRaw) && tracker) {
    const apiOrderId = await getTrackerOrderId(tracker);
    const m = apiOrderId?.match(/^sub_([a-f0-9]+)_([a-z]+)_\d+$/i);
    if (m) { sellerId = m[1]; planIdRaw = m[2]; }
  }

  if (!sellerId || !planIdRaw) return fail("could not resolve sellerId/planId from query, order_id, or tracker lookup");

  const planIdResult = z.enum(["starter", "basic", "growth", "pro"]).safeParse(planIdRaw);
  if (!planIdResult.success) return fail(`resolved planId "${planIdRaw}" is not a valid plan`);
  const planId = planIdResult.data;

  const seller = await Seller.findById(sellerId);
  if (!seller) return fail(`seller not found for sellerId=${sellerId}`);

  // Prevent double-activation if webhook already processed it
  if (seller.subscriptionStatus === "active" && seller.planId === planId) {
    console.log(`[subscription] callback: already active sellerId=${sellerId} planId=${planId} (webhook likely already handled it)`);
    return res.redirect(`${env.appUrl}/dashboard/plan?payment=success`);
  }

  const plan = getPlan(planId);
  const now = new Date();

  seller.planId = planId;
  seller.subscriptionStatus = "active";
  seller.subscriptionStartedAt = now;
  seller.subscriptionEndsAt = addBillingPeriod(now);
  seller.autoRenew = false;
  await seller.save();

  await Payment.create({
    sellerId: seller._id,
    planId,
    amount: plan.price,
    method: "card",
    paidAt: now,
    notes: `Subscription via Safepay callback (${env.safepayEnv})`,
  });

  if (seller.storeId) {
    await Store.updateOne({ _id: seller.storeId }, { status: "active" });
  }

  console.log(`[subscription] callback activated sellerId=${sellerId} planId=${planId} endsAt=${seller.subscriptionEndsAt?.toISOString()}`);
  res.redirect(`${env.appUrl}/dashboard/plan?payment=success`);
});

export const getMyPayments = asyncHandler(async (req: Request, res: Response) => {
  const seller = await currentSeller(req);
  const payments = await Payment.find({ sellerId: seller._id }).sort({ paidAt: -1 });
  res.json(payments.map((p) => p.toJSON()));
});

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

export const toggleAutoRenew = asyncHandler(async (req: Request, res: Response) => {
  const seller = await currentSeller(req);
  seller.autoRenew = !seller.autoRenew;
  await seller.save();
  res.json({ autoRenew: seller.autoRenew });
});

export const cancelSubscription = asyncHandler(async (req: Request, res: Response) => {
  const seller = await currentSeller(req);
  seller.autoRenew = false;
  if (seller.subscriptionStatus === "active" || seller.subscriptionStatus === "trial") {
    seller.subscriptionStatus = "cancelled";
  }
  await seller.save();
  res.json({ ok: true, subscriptionStatus: seller.subscriptionStatus, subscriptionEndsAt: seller.subscriptionEndsAt });
});
