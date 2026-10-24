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
import { Customer } from "../models/Customer";
import { Order } from "../models/Order";
import { SocialClick, SOCIAL_PLATFORMS } from "../models/SocialClick";
import { sinceFilter, socialClickReport, socialClicksQuerySchema } from "../lib/socialClicks";
import { PLANS } from "../lib/plans";
import { syncPlanVisibility } from "../lib/planVisibility";
import { getSubscriptionSettings } from "../lib/subscriptionSettings";
import { Settings } from "../models/Settings";
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
  type: z.enum(["store.created", "product.created", "buyer.registered"]).optional(),
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
      "snapshot.buyerName",
      "snapshot.buyerEmail",
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

const EVENT_LABEL: Record<string, string> = {
  "store.created": "Store created",
  "product.created": "Product added",
  "buyer.registered": "Buyer joined",
};

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
    "Buyer name",
    "Buyer email",
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
      EVENT_LABEL[l.type] ?? l.type,
      s.storeName,
      s.productName,
      s.category,
      s.city,
      s.price,
      s.sellerName,
      s.sellerEmail,
      s.buyerName,
      s.buyerEmail,
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
  if (data.planId) await syncPlanVisibility(seller);
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
    const o = savedById.get(plan.id);
    return {
      ...plan,
      price: o?.price ?? plan.price,
      productLimit: o?.productLimit ?? plan.productLimit,
      imageLimit: o?.imageLimit ?? plan.imageLimit,
      videoLimit: o?.videoLimit ?? plan.videoLimit,
      enabled: o?.enabled ?? true,
      priceUsd: o?.priceUsd ?? 0,
      name: o?.name?.trim() || plan.name,
      tagline: o?.tagline ?? "",
      description: o?.description ?? "",
      features: o?.features ?? [],
      highlighted: o?.highlighted ?? false,
    };
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
  priceUsd: z.number().nonnegative().max(100000).optional(),
  name: z.string().trim().max(40).optional(),
  tagline: z.string().trim().max(60).optional(),
  description: z.string().trim().max(400).optional(),
  features: z.array(z.string().trim().min(1).max(120)).max(15).optional(),
  highlighted: z.boolean().optional(),
});

/** PATCH /api/admin/plan-config — upsert a plan's config. */
export const updatePlanConfig = asyncHandler(async (req: Request, res: Response) => {
  const data = planConfigSchema.parse(req.body);
  const config = await PlanConfig.findOneAndUpdate(
    { planId: data.planId },
    { ...data, enabled: data.enabled ?? true },
    { upsert: true, new: true }
  );
  // Only one plan is the "Recommended" card at a time.
  if (data.highlighted) {
    await PlanConfig.updateMany({ planId: { $ne: data.planId } }, { $set: { highlighted: false } });
  }
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

/* --------------------------------- Buyers -------------------------------- */

interface BuyerRow {
  id: string;
  name: string;
  email: string;
  phone: string;
  country?: string;
  createdAt: Date;
  lastLoginAt?: Date;
  orders: number;
  /** Sum of non-cancelled order totals (PKR). */
  totalSpent: number;
  lastOrderAt: Date | null;
}

/** Every buyer account with their order activity, newest signups first. */
async function buyerRows(q?: string): Promise<BuyerRow[]> {
  const filter: Record<string, unknown> = {};
  if (q) {
    const re = new RegExp(escapeRegex(q), "i");
    filter.$or = [{ name: re }, { email: re }, { phone: re }];
  }
  const customers = await Customer.find(filter).sort({ createdAt: -1 });
  const stats = await Order.aggregate<{ _id: unknown; orders: number; spent: number; last: Date }>([
    { $match: { customerId: { $in: customers.map((c) => c._id) } } },
    {
      $group: {
        _id: "$customerId",
        orders: { $sum: 1 },
        spent: { $sum: { $cond: [{ $eq: ["$status", "cancelled"] }, 0, "$total"] } },
        last: { $max: "$createdAt" },
      },
    },
  ]);
  const statsById = new Map(stats.map((s) => [String(s._id), s]));
  return customers.map((c) => {
    const s = statsById.get(c.id);
    return {
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      country: c.country,
      createdAt: c.createdAt,
      lastLoginAt: c.lastLoginAt,
      orders: s?.orders ?? 0,
      totalSpent: s?.spent ?? 0,
      lastOrderAt: s?.last ?? null,
    };
  });
}

const buyersQuerySchema = z.object({ q: z.string().trim().max(100).optional() });

/** GET /api/admin/buyers?q= — buyer accounts with signup, last login and orders. */
export const getBuyers = asyncHandler(async (req: Request, res: Response) => {
  const { q } = buyersQuerySchema.parse(req.query);
  res.json(await buyerRows(q));
});

/** GET /api/admin/buyers/export?q= — the buyers list as CSV (Pakistan time). */
export const exportBuyers = asyncHandler(async (req: Request, res: Response) => {
  const { q } = buyersQuerySchema.parse(req.query);
  const pkt = (d?: Date | null) => (d ? new Date(d).toLocaleString("en-GB", { timeZone: "Asia/Karachi" }) : "");
  const header = ["Name", "Email", "Phone", "Country", "Joined (PKT)", "Last login (PKT)", "Orders", "Total spent (PKR)", "Last order (PKT)"];
  const rows = (await buyerRows(q)).map((b) => [
    b.name,
    b.email,
    b.phone,
    b.country,
    pkt(b.createdAt),
    pkt(b.lastLoginAt),
    b.orders,
    b.totalSpent,
    pkt(b.lastOrderAt),
  ]);
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
  const stamp = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="bazaarnagar-buyers-${stamp}.csv"`);
  res.send(`\uFEFF${csv}\r\n`);
});

/* --------------------------------- Orders -------------------------------- */

const ORDER_STATUSES = ["pending", "confirmed", "shipped", "delivered", "cancelled"] as const;

const adminOrdersFilterSchema = z.object({
  status: z.enum(ORDER_STATUSES).optional(),
  /** Order number (last 6 of the id), buyer name/phone/email, or shop name. */
  q: z.string().trim().max(100).optional(),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
});

async function adminOrdersFilter(query: z.infer<typeof adminOrdersFilterSchema>) {
  const filter: Record<string, unknown> = {};
  if (query.status) filter.status = query.status;
  if (query.from || query.to) {
    filter.createdAt = {
      ...(query.from ? { $gte: new Date(query.from) } : {}),
      ...(query.to ? { $lte: new Date(query.to) } : {}),
    };
  }
  if (query.q) {
    const re = new RegExp(escapeRegex(query.q.replace(/^#/, "")), "i");
    const stores = await Store.find({ name: re }).select("_id");
    filter.$or = [
      { customerName: re },
      { customerPhone: re },
      { customerEmail: re },
      { storeId: { $in: stores.map((s) => s._id) } },
      // Order number shown to people = last 6 characters of the id.
      { $expr: { $regexMatch: { input: { $toString: "$_id" }, regex: escapeRegex(query.q.replace(/^#/, "")), options: "i" } } },
    ];
  }
  return filter;
}

/** Add shop name/slug to orders for admin views. */
async function withStoreNames<T extends { storeId: unknown }>(orders: T[]) {
  const stores = await Store.find({ _id: { $in: orders.map((o) => o.storeId) } }).select("name slug");
  const byId = new Map(stores.map((s) => [s.id, s]));
  return orders.map((o) => {
    const store = byId.get(String(o.storeId));
    return { ...o, storeName: store?.name ?? "Deleted shop", storeSlug: store?.slug ?? "" };
  });
}

/** GET /api/admin/orders — every order on the platform, newest first, with totals. */
export const getAdminOrders = asyncHandler(async (req: Request, res: Response) => {
  const { page, limit, ...rest } = adminOrdersFilterSchema
    .extend({
      page: z.coerce.number().int().min(1).default(1),
      limit: z.coerce.number().int().min(1).max(100).default(25),
    })
    .parse(req.query);
  const filter = await adminOrdersFilter(rest);

  const [orders, total, sums] = await Promise.all([
    Order.find(filter).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
    Order.countDocuments(filter),
    Order.aggregate<{ _id: string; count: number; value: number }>([
      { $match: filter },
      { $group: { _id: "$status", count: { $sum: 1 }, value: { $sum: "$total" } } },
    ]),
  ]);

  const byStatus = Object.fromEntries(ORDER_STATUSES.map((s) => [s, 0])) as Record<string, number>;
  let value = 0;
  for (const s of sums) {
    byStatus[s._id] = s.count;
    if (s._id !== "cancelled") value += s.value;
  }

  res.json({
    items: await withStoreNames(orders.map((o) => o.toJSON() as Record<string, unknown> & { storeId: unknown })),
    total,
    page,
    pages: Math.max(1, Math.ceil(total / limit)),
    summary: { byStatus, value },
  });
});

/** GET /api/admin/orders/export — orders as CSV with the same filters (Pakistan time). */
export const exportAdminOrders = asyncHandler(async (req: Request, res: Response) => {
  const filter = await adminOrdersFilter(adminOrdersFilterSchema.parse(req.query));
  const orders = await withStoreNames(
    await Order.find(filter).sort({ createdAt: -1 }).limit(EXPORT_MAX_ROWS).lean()
  );
  const pkt = (d?: Date) => (d ? new Date(d).toLocaleString("en-GB", { timeZone: "Asia/Karachi" }) : "");
  const header = [
    "Order #",
    "Placed (PKT)",
    "Status",
    "Shop",
    "Buyer",
    "Phone",
    "Email",
    "City",
    "Address",
    "Account",
    "Items",
    "Subtotal (PKR)",
    "Delivery (PKR)",
    "Total (PKR)",
    "Payment",
    "Note",
  ];
  const rows = orders.map((o) => [
    `#${String(o._id).slice(-6).toUpperCase()}`,
    pkt(o.createdAt),
    o.status,
    o.storeName,
    o.customerName,
    o.customerPhone,
    o.customerEmail,
    o.customerCity,
    o.customerAddress,
    o.customerId ? "Buyer account" : "Guest",
    o.items.map((i) => `${i.name} x${i.quantity}`).join("; "),
    o.subtotal ?? o.items.reduce((s, i) => s + i.price * i.quantity, 0),
    o.deliveryFee ?? 0,
    o.total,
    o.paymentMethod === "cod" ? "Cash on Delivery" : o.paymentMethod,
    o.note,
  ]);
  const csv = [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
  const stamp = new Date().toLocaleDateString("en-CA", { timeZone: "Asia/Karachi" });
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="bazaarnagar-orders-${stamp}.csv"`);
  res.send(`\uFEFF${csv}\r\n`);
});

/* ------------------------------ Store review ----------------------------- */

const storeReviewQuerySchema = z.object({ status: z.enum(["pending", "reviewed"]).default("pending") });

/**
 * GET /api/admin/store-reviews?status=pending|reviewed — stores queued for a
 * check after being created or edited (newest request first).
 */
export const getStoreReviews = asyncHandler(async (req: Request, res: Response) => {
  const { status } = storeReviewQuerySchema.parse(req.query);
  const stores = await Store.find({ "review.status": status }).sort(
    status === "pending" ? { "review.requestedAt": -1 } : { "review.reviewedAt": -1 }
  ).limit(200);
  const sellers = await Seller.find({ _id: { $in: stores.map((s) => s.sellerId) } }).select("name email phone");
  const sellerById = new Map(sellers.map((s) => [s.id, s]));
  res.json(
    stores.map((s) => {
      const seller = sellerById.get(String(s.sellerId));
      return {
        ...s.toJSON(),
        sellerName: seller?.name ?? "Unknown seller",
        sellerEmail: seller?.email ?? "",
        sellerPhone: seller?.phone ?? "",
      };
    })
  );
});

/** PATCH /api/admin/stores/:id/review — mark a queued store as checked. */
export const markStoreReviewed = asyncHandler(async (req: Request, res: Response) => {
  const store = await Store.findById(req.params.id);
  if (!store) throw new ApiError(404, "Store not found");
  if (store.review?.status !== "pending") throw new ApiError(400, "This store isn't waiting for review");
  store.review = { ...store.review, status: "reviewed", reviewedAt: new Date() };
  await store.save();
  res.json(store.toJSON());
});

/**
 * GET /api/admin/social-clicks?days=7|30|90|all — every store that has social
 * links (or got clicks), with its clicks per platform; most clicked first.
 */
export const getSocialClicksByStore = asyncHandler(async (req: Request, res: Response) => {
  const { days } = socialClicksQuerySchema.parse(req.query);
  const rows: { _id: { storeId: unknown; platform: string }; n: number; last: Date }[] = await SocialClick.aggregate([
    { $match: sinceFilter(days) },
    { $group: { _id: { storeId: "$storeId", platform: "$platform" }, n: { $sum: 1 }, last: { $max: "$createdAt" } } },
  ]);
  const clicks = new Map<string, { totals: Record<string, number>; total: number; lastClickAt?: Date }>();
  for (const { _id, n, last } of rows) {
    const c = clicks.get(String(_id.storeId)) ?? { totals: {}, total: 0 };
    c.totals[_id.platform] = n;
    c.total += n;
    if (!c.lastClickAt || last > c.lastClickAt) c.lastClickAt = last;
    clicks.set(String(_id.storeId), c);
  }

  const hasSocials = SOCIAL_PLATFORMS.map((p) => ({ [`socials.${p}`]: { $nin: [null, ""] } }));
  const stores = await Store.find({ $or: [{ _id: { $in: [...clicks.keys()] } }, ...hasSocials] }).select(
    "name slug sellerId socials"
  );
  const sellers = await Seller.find({ _id: { $in: stores.map((s) => s.sellerId) } }).select("name email");
  const sellerById = new Map(sellers.map((s) => [s.id, s]));

  res.json(
    stores
      .map((s) => {
        const seller = sellerById.get(String(s.sellerId));
        const c = clicks.get(s.id);
        return {
          id: s.id,
          storeId: s.id,
          storeName: s.name,
          storeSlug: s.slug,
          sellerName: seller?.name ?? "Unknown seller",
          sellerEmail: seller?.email ?? "",
          platforms: SOCIAL_PLATFORMS.filter((p) => s.socials?.[p]),
          total: c?.total ?? 0,
          totals: c?.totals ?? {},
          lastClickAt: c?.lastClickAt,
        };
      })
      .sort((a, b) => b.total - a.total || a.storeName.localeCompare(b.storeName))
  );
});

/** GET /api/admin/stores/:id/social-clicks?days=… — one store's social link clicks by day. */
export const getStoreSocialClicks = asyncHandler(async (req: Request, res: Response) => {
  const { days } = socialClicksQuerySchema.parse(req.query);
  const store = await Store.findById(req.params.id).select("_id");
  if (!store) throw new ApiError(404, "Store not found");
  res.json(await socialClickReport(String(store._id), days));
});

/* ------------------------- Subscription settings ------------------------- */

/** GET /api/admin/subscription-settings — what happens when a paid plan expires. */
export const getSubscriptionSettingsHandler = asyncHandler(async (_req: Request, res: Response) => {
  res.json(await getSubscriptionSettings());
});

const subscriptionSettingsSchema = z.object({
  downgradeAfterExpiry: z.boolean(),
  graceDays: z.number().int().min(1).max(60),
});

/** PATCH /api/admin/subscription-settings */
export const updateSubscriptionSettings = asyncHandler(async (req: Request, res: Response) => {
  const data = subscriptionSettingsSchema.parse(req.body);
  await Settings.findOneAndUpdate({ key: "subscription" }, { $set: data }, { upsert: true });
  res.json(await getSubscriptionSettings());
});
