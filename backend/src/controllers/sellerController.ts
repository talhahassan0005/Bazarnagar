import type { Request, Response } from "express";
import { z } from "zod";
import { Seller } from "../models/Seller";
import { Store } from "../models/Store";
import { Product } from "../models/Product";
import { Payment } from "../models/Payment";
import { getPlan, addBillingPeriod } from "../lib/plans";
import { DAY_MS, getBoostPricing } from "../lib/boost";
import { PaymentRequest } from "../models/PaymentRequest";
import { moderateProduct } from "../lib/moderation";
import { logProductCreated, logStoreCreated } from "../lib/activityLog";
import { newStoreReview, queueStoreReview } from "../lib/storeReview";
import { SOCIAL_PLATFORMS } from "../models/SocialClick";
import { socialClickReport, socialClicksQuerySchema } from "../lib/socialClicks";
import { getSubscriptionSettings } from "../lib/subscriptionSettings";
import { stripeEnabled, createSubscriptionCheckoutSession } from "../lib/stripe";
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

const kycSchema = z.object({
  cnicFront: z.string().min(1),
  cnicBack: z.string().min(1),
});

/** POST /api/seller/kyc — submit (or resubmit) CNIC images for verification. */
export const submitKyc = asyncHandler(async (req: Request, res: Response) => {
  const seller = await currentSeller(req);
  const data = kycSchema.parse(req.body);

  seller.kycCnicFront = data.cnicFront;
  seller.kycCnicBack = data.cnicBack;
  seller.kycSubmittedAt = new Date();
  seller.kycRejectionReason = undefined;
  await seller.save();

  res.json(seller.toJSON());
});

const storeSchema = z.object({
  name: z.string().min(2),
  description: z.string().min(1),
  category: z.string().min(1),
  whatsapp: z.string().min(6),
  // Sellers can type their own city ("Other"): tidy spacing and capitalise
  // each word, so "mandi  bahauddin" is stored as "Mandi Bahauddin".
  city: z
    .string()
    .trim()
    .min(1)
    .max(60)
    .transform((c) => c.replace(/\s+/g, " ").replace(/(^|\s)(\S)/g, (_m, sp, ch) => sp + ch.toUpperCase())),
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
    .object(Object.fromEntries(SOCIAL_PLATFORMS.map((p) => [p, z.string().trim().max(200).optional()])))
    .optional(),
  deliveryInfo: z.string().optional(),
  noDelivery: z.boolean().optional(),
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
  if (env.kycRequired && seller.status === "pending") {
    throw new ApiError(403, "Your account is awaiting verification. Submit your KYC documents first.");
  }
  const data = storeSchema.parse(req.body);

  let store = seller.storeId ? await Store.findById(seller.storeId) : null;

  if (!store) {
    const slug = await uniqueSlug(data.name);
    store = await Store.create({ ...data, sellerId: seller._id, slug, review: newStoreReview() });
    seller.storeId = store._id as typeof seller.storeId;
    await seller.save();
    await logStoreCreated(seller, store);
  } else {
    Object.assign(store, data);
    queueStoreReview(store, store.modifiedPaths());
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

  const before = JSON.stringify(store.landing ?? null);
  store.landing = landingSchema.parse(req.body);
  if (JSON.stringify(store.landing) !== before) queueStoreReview(store, ["landing"]);
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
  // The free plan never expires, so it has no end date.
  seller.subscriptionEndsAt = planId === "starter" ? undefined : addBillingPeriod(now);
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
  deliveryOption: z.enum(["available", "not_available", "negotiable"]).default("available"),
  deliveryFee: z.number().nonnegative().optional(),
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
  await logProductCreated(seller, store, product);

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

/** GET /api/seller/boost-pricing — live per-day boost price and allowed day range. */
export const getBoostPricingForSeller = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await getBoostPricing());
});

const boostSchema = z.object({
  days: z.number().int().positive(),
  method: z.enum(["bank", "jazzcash", "easypaisa"]),
  reference: z.string().trim().min(3, "Enter the transaction ID / reference number").max(100),
  proofUrl: z.string().optional(),
});

/**
 * POST /api/seller/products/:id/boost — any seller (free plan included) pays
 * per day to feature a product. The boost starts immediately; the payment is
 * logged for the admin, who can reject it later (removing the boost) if the
 * money never arrived.
 */
export const boostProduct = asyncHandler(async (req: Request, res: Response) => {
  const { seller, store } = await requireOwnedStore(req);
  const data = boostSchema.parse(req.body);
  const pricing = await getBoostPricing();
  if (data.days < pricing.minDays || data.days > pricing.maxDays) {
    throw new ApiError(400, `Choose between ${pricing.minDays} and ${pricing.maxDays} days.`);
  }

  const product = await Product.findOne({ _id: req.params.id, storeId: store._id });
  if (!product) throw new ApiError(404, "Product not found");

  // Extends an active boost, otherwise starts now.
  const now = new Date();
  const base = product.boostedUntil && product.boostedUntil > now ? product.boostedUntil : now;
  product.boostedUntil = new Date(base.getTime() + data.days * DAY_MS);
  await product.save();

  await PaymentRequest.create({
    sellerId: seller._id,
    purpose: "boost",
    productId: product._id,
    days: data.days,
    amount: data.days * pricing.pricePerDay,
    method: data.method,
    reference: data.reference,
    proofUrl: data.proofUrl,
    status: "pending",
  });

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
    addToCartClicks: store?.addToCartClicks ?? 0,
    buyNowClicks: store?.buyNowClicks ?? 0,
  });
});

/* --------------------------- Subscription / Payments ---------------------- */

const checkoutSchema = z.object({
  planId: z.enum(["starter", "basic", "growth", "pro"]),
});

/**
 * POST /api/seller/subscription/checkout
 * Creates a Stripe Checkout Session for the chosen plan. Activation happens
 * via the /api/webhooks/stripe webhook (server-to-server, does not depend on
 * the browser redirect) — success_url is purely for the return-to-app UX.
 */
export const subscriptionCheckout = asyncHandler(async (req: Request, res: Response) => {
  const seller = await currentSeller(req);
  const { planId } = checkoutSchema.parse(req.body);
  const plan = getPlan(planId);

  if (!stripeEnabled) {
    throw new ApiError(503, "Payment gateway is not configured. Please contact support.");
  }

  console.log(`[subscription] checkout start sellerId=${seller.id} planId=${planId}`);

  const { url, sessionId } = await createSubscriptionCheckoutSession({
    amount: plan.price,
    sellerId: seller.id,
    planId,
    customerEmail: seller.email,
    successUrl: `${env.appUrl}/dashboard/plan?payment=success`,
    cancelUrl: `${env.appUrl}/dashboard/plan?payment=cancelled`,
  });

  console.log(`[subscription] checkout session created sellerId=${seller.id} session=${sessionId}`);
  res.json({ url, orderId: sessionId, planId });
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
  const lapsePolicy = await getSubscriptionSettings();
  const downgradeAt =
    endsAt && seller.planId !== "starter" && lapsePolicy.downgradeAfterExpiry
      ? new Date(endsAt.getTime() + lapsePolicy.graceDays * DAY_MS)
      : null;
  res.json({
    planId: seller.planId,
    subscriptionStatus: seller.subscriptionStatus,
    subscriptionEndsAt: endsAt ?? null,
    autoRenew: seller.autoRenew,
    daysRemaining,
    hasCardToken: Boolean(seller.stripePaymentMethodId),
    // When a lapsed paid plan will move to Free (null if it won't / isn't lapsing).
    downgradeAt,
    hiddenProducts: seller.storeId
      ? await Product.countDocuments({ storeId: seller.storeId, hiddenOverPlanLimit: true })
      : 0,
    downgradedFromPlanId: seller.downgradedFromPlanId ?? null,
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

/** GET /api/seller/social-clicks?days=7|30|90|all — taps on the shop's social links, by day. */
export const getMySocialClicks = asyncHandler(async (req: Request, res: Response) => {
  const { days } = socialClicksQuerySchema.parse(req.query);
  const seller = await currentSeller(req);
  if (!seller.storeId) return res.json({ total: 0, totals: {}, days: [] });
  res.json(await socialClickReport(seller.storeId, days));
});
