import type { Request, Response } from "express";
import type { Model } from "mongoose";
import { z } from "zod";
import { Seller } from "../models/Seller";
import { Store } from "../models/Store";
import { Product } from "../models/Product";
import { Payment } from "../models/Payment";
import { PlanConfig } from "../models/PlanConfig";
import { BoostPricing } from "../models/BoostPricing";
import { getBoostPricing } from "../lib/boost";
import { Admin } from "../models/Admin";
import { ActivityLog } from "../models/ActivityLog";
import { UploadLog } from "../models/UploadLog";
import { SearchLog } from "../models/SearchLog";
import { PLANS } from "../lib/plans";
import { addBillingPeriod } from "../lib/plans";
import { ApiError, asyncHandler } from "../lib/helpers";
import { env } from "../config/env";

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
  const searchCounts = await searchesPerProduct();
  res.json(
    products.map((p) => ({
      ...p.toJSON(),
      store: storeById.get(p.storeId.toString())?.toJSON() ?? null,
      searchCount: searchCounts.get(p.id) ?? 0,
    }))
  );
});

/** How many logged keyword searches returned each product (optionally since a date). */
async function searchesPerProduct(since?: Date): Promise<Map<string, number>> {
  const rows = await SearchLog.aggregate<{ _id: unknown; count: number }>([
    ...(since ? [{ $match: { createdAt: { $gte: since } } }] : []),
    { $unwind: "$productIds" },
    { $group: { _id: "$productIds", count: { $sum: 1 } } },
  ]);
  return new Map(rows.map((r) => [String(r._id), r.count]));
}

const insightsQuerySchema = z.object({ days: z.enum(["7", "30", "all"]).default("30") });

/**
 * GET /api/admin/search-insights?days=7|30|all — what shoppers search for:
 * top terms, searches with no results, and products found most often.
 */
export const getSearchInsights = asyncHandler(async (req: Request, res: Response) => {
  const { days } = insightsQuerySchema.parse(req.query);
  const since = days === "all" ? undefined : new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000);
  const match = since ? { createdAt: { $gte: since } } : {};

  const [totals, topTerms, zeroResultTerms, perProduct] = await Promise.all([
    SearchLog.aggregate<{ searches: number; terms: string[]; zero: number }>([
      { $match: match },
      {
        $group: {
          _id: null,
          searches: { $sum: 1 },
          terms: { $addToSet: "$query" },
          zero: { $sum: { $cond: [{ $eq: ["$resultCount", 0] }, 1, 0] } },
        },
      },
    ]),
    SearchLog.aggregate<{ _id: string; count: number; avgResults: number; lastSearched: Date }>([
      { $match: match },
      {
        $group: {
          _id: "$query",
          count: { $sum: 1 },
          avgResults: { $avg: "$resultCount" },
          lastSearched: { $max: "$createdAt" },
        },
      },
      { $sort: { count: -1, lastSearched: -1 } },
      { $limit: 25 },
    ]),
    SearchLog.aggregate<{ _id: string; count: number; lastSearched: Date }>([
      { $match: { ...match, resultCount: 0 } },
      { $group: { _id: "$query", count: { $sum: 1 }, lastSearched: { $max: "$createdAt" } } },
      { $sort: { count: -1, lastSearched: -1 } },
      { $limit: 25 },
    ]),
    searchesPerProduct(since),
  ]);

  const topProductIds = [...perProduct.entries()].sort((a, b) => b[1] - a[1]).slice(0, 25);
  const products = await Product.find({ _id: { $in: topProductIds.map(([id]) => id) } }).select("name storeId");
  const productById = new Map(products.map((p) => [p.id, p]));
  const stores = await Store.find({ _id: { $in: products.map((p) => p.storeId) } }).select("name slug");
  const storeById = new Map(stores.map((s) => [s.id, s]));

  const t = totals[0];
  res.json({
    days,
    totals: { searches: t?.searches ?? 0, uniqueTerms: t?.terms.length ?? 0, zeroResultSearches: t?.zero ?? 0 },
    topTerms: topTerms.map((r) => ({
      query: r._id,
      count: r.count,
      avgResults: Math.round(r.avgResults),
      lastSearched: r.lastSearched,
    })),
    zeroResultTerms: zeroResultTerms.map((r) => ({ query: r._id, count: r.count, lastSearched: r.lastSearched })),
    topProducts: topProductIds
      .map(([id, searches]) => {
        const product = productById.get(id);
        if (!product) return null; // deleted since
        const store = storeById.get(product.storeId.toString());
        return { productId: id, name: product.name, storeName: store?.name ?? "", storeSlug: store?.slug ?? "", searches };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null),
  });
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

const activityFilterSchema = z.object({
  type: z.enum(["store.created", "product.created"]).optional(),
  /** Free-text search across seller, store, product, city and category. */
  q: z.string().trim().max(100).optional(),
  /** Inclusive ISO datetime bounds (the admin's local day start / end). */
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
});

const activityQuerySchema = activityFilterSchema.extend({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(25),
});

const escapeRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Build the Mongo filter shared by the activity list and its CSV export. */
function activityFilter(query: z.infer<typeof activityFilterSchema>) {
  const filter: Record<string, unknown> = {};
  if (query.type) filter.type = query.type;
  if (query.from || query.to) {
    filter.createdAt = {
      ...(query.from ? { $gte: new Date(query.from) } : {}),
      ...(query.to ? { $lte: new Date(query.to) } : {}),
    };
  }
  if (query.q) {
    const re = new RegExp(escapeRegex(query.q), "i");
    filter.$or = [
      "snapshot.sellerName",
      "snapshot.sellerEmail",
      "snapshot.storeName",
      "snapshot.productName",
      "snapshot.city",
      "snapshot.category",
    ].map((field) => ({ [field]: re }));
  }
  return filter;
}

/** GET /api/admin/activity — store creations and product additions, newest first. */
export const getActivityLogs = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, ...rest } = activityQuerySchema.parse(req.query);
  const filter = activityFilter(rest);
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

const EXPORT_MAX_ROWS = 50_000;

/** Quote a CSV cell, and neutralise values a spreadsheet would run as a formula. */
function csvCell(value: unknown): string {
  let s = value == null ? "" : String(value);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/**
 * GET /api/admin/activity/export — the activity log as a CSV file, using the
 * same filters as the list (type, search, date range). Times are Pakistan time.
 */
export const exportActivityLogs = asyncHandler(async (req: Request, res: Response) => {
  const filter = activityFilter(activityFilterSchema.parse(req.query));
  const logs = await ActivityLog.find(filter).sort({ createdAt: -1 }).limit(EXPORT_MAX_ROWS).lean();

  const site = env.appUrl.replace(/\/$/, "");
  const header = [
    "Date & time (PKT)",
    "Event",
    "Store",
    "Product",
    "Category",
    "City",
    "Price (PKR)",
    "Seller name",
    "Seller email",
    "Link",
  ];
  const rows = logs.map((l) => {
    const s = l.snapshot ?? {};
    const link = s.storeSlug
      ? l.type === "product.created" && l.productId
        ? `${site}/store/${s.storeSlug}/product/${l.productId}`
        : `${site}/store/${s.storeSlug}`
      : "";
    return [
      new Date(l.createdAt).toLocaleString("en-GB", { timeZone: "Asia/Karachi" }),
      l.type === "store.created" ? "Store created" : "Product added",
      s.storeName,
      s.productName,
      s.category,
      s.city,
      s.price,
      s.sellerName,
      s.sellerEmail,
      link,
    ];
  });

  const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
  // en-CA formats as YYYY-MM-DD; use Pakistan's date, not UTC's.
  const stamp = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="bazaarnagar-activity-${stamp}.csv"`);
  // BOM so Excel opens the file as UTF-8 (Urdu names, ₨ etc. render correctly).
  res.send(`﻿${csv}\r\n`);
});

/**
 * GET /api/admin/storage?scope=paid|all — storage used per store, from the
 * upload log (summed per seller, since each seller owns one store). Paid
 * stores only by default.
 */
export const getStorageUsage = asyncHandler(async (req: Request, res: Response) => {
  const scope = req.query.scope === "all" ? "all" : "paid";

  const usage = await UploadLog.aggregate<{ _id: unknown; files: number; bytes: number; lastUpload: Date }>([
    { $match: { sellerId: { $ne: null } } },
    { $group: { _id: "$sellerId", files: { $sum: 1 }, bytes: { $sum: "$size" }, lastUpload: { $max: "$createdAt" } } },
  ]);
  const usageBySeller = new Map(usage.map((u) => [String(u._id), u]));

  const sellerFilter: Record<string, unknown> = { storeId: { $ne: null } };
  if (scope === "paid") sellerFilter.planId = { $ne: "starter" };
  const sellers = await Seller.find(sellerFilter).select("name email planId storeId");
  const stores = await Store.find({ _id: { $in: sellers.map((s) => s.storeId) } }).select("name slug status");
  const storeById = new Map(stores.map((s) => [s.id, s]));

  const rows = sellers
    .map((seller) => {
      const store = storeById.get(String(seller.storeId));
      if (!store) return null;
      const u = usageBySeller.get(seller.id);
      return {
        storeId: store.id,
        storeName: store.name,
        storeSlug: store.slug,
        storeStatus: store.status,
        sellerName: seller.name,
        sellerEmail: seller.email,
        planId: seller.planId,
        files: u?.files ?? 0,
        bytes: u?.bytes ?? 0,
        lastUpload: u?.lastUpload ?? null,
      };
    })
    .filter((r): r is NonNullable<typeof r> => r !== null)
    .sort((a, b) => b.bytes - a.bytes);

  res.json({
    scope,
    totals: {
      stores: rows.length,
      files: rows.reduce((s, r) => s + r.files, 0),
      bytes: rows.reduce((s, r) => s + r.bytes, 0),
    },
    rows,
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

/** GET /api/admin/boost-config — the per-day boost price and allowed day range. */
export const getBoostConfig = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await getBoostPricing());
});

const boostConfigSchema = z
  .object({
    pricePerDay: z.number().int().min(0),
    minDays: z.number().int().min(1).max(365),
    maxDays: z.number().int().min(1).max(365),
  })
  .refine((d) => d.maxDays >= d.minDays, { message: "Max days must be at least min days", path: ["maxDays"] });

/** PATCH /api/admin/boost-config — set the per-day boost price and day range. */
export const updateBoostConfig = asyncHandler(async (req: Request, res: Response) => {
  const data = boostConfigSchema.parse(req.body);
  await BoostPricing.findOneAndUpdate({ key: "boost" }, { $set: data }, { upsert: true });
  res.json(await getBoostPricing());
});

/* ------------------------------- Search log ------------------------------ */

const searchLogQuerySchema = z.object({
  days: z.enum(["7", "30", "all"]).default("30"),
  /** Filter to searches whose keyword contains this text. */
  q: z.string().trim().max(100).optional(),
});

function searchLogFilter({ days, q }: z.infer<typeof searchLogQuerySchema>) {
  const filter: Record<string, unknown> = {};
  if (days !== "all") filter.createdAt = { $gte: new Date(Date.now() - Number(days) * 24 * 60 * 60 * 1000) };
  if (q) filter.query = { $regex: escapeRegex(q.toLowerCase()) };
  return filter;
}

/** GET /api/admin/search-logs — every keyword search with its time, newest first. */
export const getSearchLogs = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, ...rest } = searchLogQuerySchema
    .extend({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(25),
    })
    .parse(req.query);
  const filter = searchLogFilter(rest);
  const [items, total] = await Promise.all([
    SearchLog.find(filter, { productIds: 0 })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    SearchLog.countDocuments(filter),
  ]);
  res.json({
    items: items.map((i) => i.toJSON()),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
  });
});

/** GET /api/admin/search-logs/export — the search log as CSV (Pakistan time). */
export const exportSearchLogs = asyncHandler(async (req: Request, res: Response) => {
  const filter = searchLogFilter(searchLogQuerySchema.parse(req.query));
  const logs = await SearchLog.find(filter, { productIds: 0 }).sort({ createdAt: -1 }).limit(EXPORT_MAX_ROWS).lean();

  const header = ["Date & time (PKT)", "Keyword", "Category", "City", "Results"];
  const rows = logs.map((l) => [
    new Date(l.createdAt).toLocaleString("en-GB", { timeZone: "Asia/Karachi" }),
    l.query,
    l.category,
    l.city,
    l.resultCount,
  ]);
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
  const stamp = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="bazaarnagar-searches-${stamp}.csv"`);
  res.send(`\uFEFF${csv}\r\n`);
});
