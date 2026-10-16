import type { Request, Response } from "express";
import type { Model } from "mongoose";
import { z } from "zod";
import { Seller } from "../models/Seller";
import { Store } from "../models/Store";
import { Product } from "../models/Product";
import { Payment } from "../models/Payment";
import { PlanConfig } from "../models/PlanConfig";
import { BoostConfig } from "../models/BoostConfig";
import { BOOST_PACKAGES } from "../lib/boost";
import { Admin } from "../models/Admin";
import { ActivityLog } from "../models/ActivityLog";
import { PLANS } from "../lib/plans";
import { addBillingPeriod } from "../lib/plans";
import { ApiError, asyncHandler } from "../lib/helpers";

/* ------------------------------- Listings -------------------------------- */

export const getAllSellers = asyncHandler(async (_req: Request, res: Response) => {
  const sellers = await Seller.find().sort({ createdAt: -1 });
  res.json(sellers.map((s) => s.toJSON()));
});

export const getAllStores = asyncHandler(async (_req: Request, res: Response) => {
  const stores = await Store.find().sort({ createdAt: -1 });
  res.json(stores.map((s) => s.toJSON()));
});

export const getAllProducts = asyncHandler(async (_req: Request, res: Response) => {
  const products = await Product.find().sort({ createdAt: -1 });
  const stores = await Store.find();
  const storeById = new Map(stores.map((s) => [s.id, s]));
  res.json(
    products.map((p) => ({
      ...p.toJSON(),
      store: storeById.get(p.storeId.toString())?.toJSON() ?? null,
    }))
  );
});

/** GET /api/admin/overview — platform totals (SRS §11 / §13). */
export const getOverview = asyncHandler(async (_req: Request, res: Response) => {
  const [sellers, stores, products] = await Promise.all([
    Seller.countDocuments(),
    Store.find(),
    Product.find(),
  ]);
  res.json({
    sellers,
    stores: stores.length,
    products: products.length,
    pendingModeration: products.filter(
      (p) => p.moderationStatus === "pending" || p.moderationStatus === "flagged"
    ).length,
    totalShopViews: stores.reduce((s, st) => s + st.views, 0),
    totalWhatsappClicks: stores.reduce((s, st) => s + st.whatsappClicks, 0),
  });
});

/* ------------------------------ Activity log ----------------------------- */

const activityQuerySchema = z.object({
  type: z.enum(["store.created", "product.created"]).optional(),
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

/** GET /api/admin/activity — store creations and product additions, newest first. */
export const getActivityLogs = asyncHandler(async (req: Request, res: Response) => {
  const { type, page, limit } = activityQuerySchema.parse(req.query);
  const filter = type ? { type } : {};
  const [items, total] = await Promise.all([
    ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    ActivityLog.countDocuments(filter),
  ]);
  res.json({
    items: items.map((i) => i.toJSON()),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
});

/** Group a collection by `field` and return [{ key, count }] sorted by count. */
async function countBy(
  model: Model<any>,
  field: string
): Promise<Array<{ key: string; count: number }>> {
  const rows = await model.aggregate<{ _id: unknown; count: number }>([
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
    { $sort: { count: -1 } },
  ]);
  return rows.map((r) => ({ key: r._id == null || r._id === "" ? "—" : String(r._id), count: r.count }));
}

/** GET /api/admin/data-summary — current snapshot of all stores and products. */
export const getDataSummary = asyncHandler(async (_req: Request, res: Response) => {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const [
    storeTotal,
    storesThisWeek,
    storesThisMonth,
    storesOpen,
    storeByStatus,
    storeByCity,
    storeByCategory,
    productTotal,
    productsThisWeek,
    productsThisMonth,
    productsBoosted,
    productByStatus,
    productByStock,
    productByModeration,
    productByCategory,
    productsPerStore,
  ] = await Promise.all([
    Store.countDocuments(),
    Store.countDocuments({ createdAt: { $gte: weekAgo } }),
    Store.countDocuments({ createdAt: { $gte: monthAgo } }),
    Store.countDocuments({ isOpen: true }),
    countBy(Store, "status"),
    countBy(Store, "city"),
    countBy(Store, "category"),
    Product.countDocuments(),
    Product.countDocuments({ createdAt: { $gte: weekAgo } }),
    Product.countDocuments({ createdAt: { $gte: monthAgo } }),
    Product.countDocuments({ boostedUntil: { $gt: now } }),
    countBy(Product, "status"),
    countBy(Product, "stockStatus"),
    countBy(Product, "moderationStatus"),
    countBy(Product, "category"),
    Product.aggregate<{ _id: unknown; count: number }>([
      { $group: { _id: "$storeId", count: { $sum: 1 } } },
    ]),
  ]);

  res.json({
    generatedAt: now.toISOString(),
    stores: {
      total: storeTotal,
      newThisWeek: storesThisWeek,
      newThisMonth: storesThisMonth,
      open: storesOpen,
      withoutProducts: Math.max(0, storeTotal - productsPerStore.length),
      byStatus: storeByStatus,
      byCity: storeByCity,
      byCategory: storeByCategory,
    },
    products: {
      total: productTotal,
      newThisWeek: productsThisWeek,
      newThisMonth: productsThisMonth,
      boosted: productsBoosted,
      byStatus: productByStatus,
      byStock: productByStock,
      byModeration: productByModeration,
      byCategory: productByCategory,
    },
  });
});

/* ------------------------------- Mutations ------------------------------- */

const updateSellerSchema = z.object({
  status: z.enum(["pending", "active", "inactive", "suspended"]).optional(),
  planId: z.enum(["starter", "basic", "growth", "pro"]).optional(),
  subscriptionStatus: z
    .enum(["trial", "active", "expired", "suspended", "cancelled"])
    .optional(),
  kycRejectionReason: z.string().optional(),
});

/** PATCH /api/admin/sellers/:id — change status / plan / subscription, or approve/reject KYC. */
export const updateSeller = asyncHandler(async (req: Request, res: Response) => {
  const data = updateSellerSchema.parse(req.body);
  const seller = await Seller.findByIdAndUpdate(req.params.id, data, { new: true });
  if (!seller) throw new ApiError(404, "Seller not found");
  // Approving clears any earlier rejection note.
  if (data.status === "active" && seller.kycRejectionReason) {
    seller.kycRejectionReason = undefined;
    await seller.save();
  }
  res.json(seller.toJSON());
});

const updateStoreSchema = z.object({
  status: z.enum(["active", "inactive", "pending"]),
});

/** PATCH /api/admin/stores/:id — approve / deactivate a store. */
export const updateStore = asyncHandler(async (req: Request, res: Response) => {
  const data = updateStoreSchema.parse(req.body);
  const store = await Store.findByIdAndUpdate(req.params.id, data, { new: true });
  if (!store) throw new ApiError(404, "Store not found");
  res.json(store.toJSON());
});

const moderateSchema = z.object({
  moderationStatus: z.enum(["pending", "approved", "flagged", "rejected", "needs_edit"]),
  reason: z.string().optional(),
});

/** PATCH /api/admin/products/:id/moderation — set moderation status. */
export const moderateProductStatus = asyncHandler(async (req: Request, res: Response) => {
  const data = moderateSchema.parse(req.body);
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { moderationStatus: data.moderationStatus, moderationReason: data.reason },
    { new: true }
  );
  if (!product) throw new ApiError(404, "Product not found");
  res.json(product.toJSON());
});

/** DELETE /api/admin/products/:id — remove an inappropriate product. */
export const removeProduct = asyncHandler(async (req: Request, res: Response) => {
  const product = await Product.findByIdAndDelete(req.params.id);
  if (!product) throw new ApiError(404, "Product not found");
  res.json({ ok: true });
});

/* -------------------------------- Payments ------------------------------- */

const paymentSchema = z.object({
  planId: z.enum(["starter", "basic", "growth", "pro"]),
  amount: z.number().nonnegative(),
  method: z.string().min(1),
  paidAt: z.string().optional(),
  notes: z.string().optional(),
  // Optionally apply the plan/subscription to the seller in one step.
  applyToSeller: z.boolean().optional(),
  subscriptionStatus: z
    .enum(["trial", "active", "expired", "suspended", "cancelled"])
    .optional(),
});

/** POST /api/admin/sellers/:id/payments — record a manual payment (SRS §13.4). */
export const recordPayment = asyncHandler(async (req: Request, res: Response) => {
  const data = paymentSchema.parse(req.body);
  const seller = await Seller.findById(req.params.id);
  if (!seller) throw new ApiError(404, "Seller not found");

  const payment = await Payment.create({
    sellerId: seller._id,
    planId: data.planId,
    amount: data.amount,
    method: data.method,
    paidAt: data.paidAt ? new Date(data.paidAt) : new Date(),
    notes: data.notes,
  });

  if (data.applyToSeller) {
    seller.planId = data.planId;
    seller.subscriptionStatus = data.subscriptionStatus ?? "active";
    await seller.save();
  }

  res.status(201).json({ payment: payment.toJSON(), seller: seller.toJSON() });
});

/** GET /api/admin/sellers/:id/payments — payment history for a seller. */
export const getSellerPayments = asyncHandler(async (req: Request, res: Response) => {
  const payments = await Payment.find({ sellerId: req.params.id }).sort({ paidAt: -1 });
  res.json(payments.map((p) => p.toJSON()));
});

/* --------------------------- Admin Payout Card --------------------------- */

/** Check if the platform admin has a payout card configured. */
export async function adminHasPayoutCard(): Promise<boolean> {
  const admin = await Admin.findOne({ "payoutCard.token": { $exists: true, $ne: "" } });
  return Boolean(admin?.payoutCard?.token);
}

const payoutCardSchema = z.object({
  token: z.string().min(1),
  last4: z.string().length(4),
  brand: z.string().min(1),
});

/** POST /api/admin/payout-card — save card token as admin payout destination. */
export const setPayoutCard = asyncHandler(async (req: Request, res: Response) => {
  const data = payoutCardSchema.parse(req.body);
  const admin = await Admin.findById(req.user!.id);
  if (!admin) throw new ApiError(404, "Admin not found");

  admin.payoutCard = { ...data, setAt: new Date() };
  await admin.save();

  // Activate all pending subscriptions now that payout card is set
  const result = await Seller.updateMany(
    { subscriptionStatus: "pending" },
    { $set: { subscriptionStatus: "active", subscriptionStartedAt: new Date() } }
  );

  // Set endDate for newly activated sellers
  const activated = await Seller.find({
    subscriptionStatus: "active",
    subscriptionEndsAt: { $exists: false },
  });
  for (const seller of activated) {
    seller.subscriptionEndsAt = addBillingPeriod(new Date());
    await seller.save();
  }

  res.json({
    ok: true,
    payoutCard: { last4: data.last4, brand: data.brand, setAt: admin.payoutCard.setAt },
    activatedCount: result.modifiedCount,
  });
});

/** DELETE /api/admin/payout-card — remove payout card. */
export const removePayoutCard = asyncHandler(async (req: Request, res: Response) => {
  const admin = await Admin.findById(req.user!.id);
  if (!admin) throw new ApiError(404, "Admin not found");
  admin.payoutCard = undefined;
  await admin.save();
  res.json({ ok: true });
});

/** GET /api/admin/payout-card — get current payout card info (no token exposed). */
export const getPayoutCard = asyncHandler(async (req: Request, res: Response) => {
  const admin = await Admin.findById(req.user!.id);
  if (!admin) throw new ApiError(404, "Admin not found");
  if (!admin.payoutCard?.token) return res.json({ set: false });
  res.json({
    set: true,
    last4: admin.payoutCard.last4,
    brand: admin.payoutCard.brand,
    setAt: admin.payoutCard.setAt,
  });
});

/* ----------------------------- Plan Config ------------------------------- */

/** GET /api/admin/plan-config — return current plan prices (DB overrides defaults). */
export const getPlanConfig = asyncHandler(async (_req: Request, res: Response) => {
  const saved = await PlanConfig.find();
  const savedById = new Map(saved.map((p) => [p.planId, p]));
  const result = Object.values(PLANS).map((plan) => {
    const override = savedById.get(plan.id);
    return override
      ? { ...plan, price: override.price, productLimit: override.productLimit, imageLimit: override.imageLimit, videoLimit: override.videoLimit, enabled: override.enabled }
      : { ...plan, enabled: true };
  });
  res.json(result);
});

const planConfigSchema = z.object({
  planId: z.enum(["starter", "basic", "growth", "pro"]),
  price: z.number().nonnegative(),
  productLimit: z.number().int().positive(),
  imageLimit: z.number().int().positive(),
  videoLimit: z.number().int().min(0),
  enabled: z.boolean().optional(),
});

/** PATCH /api/admin/plan-config — upsert a plan's config. */
export const updatePlanConfig = asyncHandler(async (req: Request, res: Response) => {
  const data = planConfigSchema.parse(req.body);
  const config = await PlanConfig.findOneAndUpdate(
    { planId: data.planId },
    { ...data, enabled: data.enabled ?? true },
    { upsert: true, new: true }
  );
  res.json(config.toJSON());
});

/* ----------------------------- Boost Config ------------------------------ */

/** GET /api/admin/boost-config — return current boost package rates (DB overrides defaults). */
export const getBoostConfig = asyncHandler(async (_req: Request, res: Response) => {
  const saved = await BoostConfig.find();
  const savedById = new Map(saved.map((p) => [p.packageId, p]));
  const result = BOOST_PACKAGES.map((pkg) => {
    const override = savedById.get(pkg.id);
    return override
      ? { id: pkg.id, label: override.label, days: override.days, price: override.price, enabled: override.enabled }
      : { ...pkg, enabled: true };
  });
  res.json(result);
});

const boostConfigSchema = z.object({
  packageId: z.string().min(1),
  label: z.string().min(1),
  days: z.number().int().positive(),
  price: z.number().nonnegative(),
  enabled: z.boolean().optional(),
});

/** PATCH /api/admin/boost-config — upsert a boost package's price/label/days/enabled. */
export const updateBoostConfig = asyncHandler(async (req: Request, res: Response) => {
  const data = boostConfigSchema.parse(req.body);
  const config = await BoostConfig.findOneAndUpdate(
    { packageId: data.packageId },
    { ...data, enabled: data.enabled ?? true },
    { upsert: true, new: true }
  );
  res.json(config.toJSON());
});
