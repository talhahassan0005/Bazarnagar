import type { Request, Response } from "express";
import { z } from "zod";
import { Seller } from "../models/Seller";
import { Store } from "../models/Store";
import { Product } from "../models/Product";
import { Payment } from "../models/Payment";
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

/* ------------------------------- Mutations ------------------------------- */

const updateSellerSchema = z.object({
  status: z.enum(["active", "inactive", "suspended"]).optional(),
  planId: z.enum(["starter", "basic", "growth", "pro"]).optional(),
  subscriptionStatus: z
    .enum(["trial", "active", "expired", "suspended", "cancelled"])
    .optional(),
});

/** PATCH /api/admin/sellers/:id — change status / plan / subscription. */
export const updateSeller = asyncHandler(async (req: Request, res: Response) => {
  const data = updateSellerSchema.parse(req.body);
  const seller = await Seller.findByIdAndUpdate(req.params.id, data, { new: true });
  if (!seller) throw new ApiError(404, "Seller not found");
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
