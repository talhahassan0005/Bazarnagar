import type { Request, Response } from "express";
import { z } from "zod";
import { PaymentRequest } from "../models/PaymentRequest";
import { Settings } from "../models/Settings";
import { Seller } from "../models/Seller";
import { Store } from "../models/Store";
import { Payment } from "../models/Payment";
import { getPlan, addBillingPeriod } from "../lib/plans";
import { ApiError, asyncHandler } from "../lib/helpers";

async function currentSeller(req: Request) {
  const seller = await Seller.findById(req.user!.id);
  if (!seller) throw new ApiError(404, "Seller not found");
  return seller;
}

/* ------------------------------ Settings ---------------------------------- */

/** GET /api/seller/manual-payment-settings — bank/JazzCash/EasyPaisa details to pay to. */
export const getManualPaymentSettings = asyncHandler(async (_req: Request, res: Response) => {
  const settings = await Settings.findOne({ key: "manual-payment" });
  res.json(
    settings?.toJSON() ?? {
      bankAccountTitle: "",
      bankAccountNumber: "",
      bankName: "",
      jazzcashNumber: "",
      easypaisaNumber: "",
      instructions: "",
    }
  );
});

const settingsSchema = z.object({
  bankAccountTitle: z.string().trim().optional(),
  bankAccountNumber: z.string().trim().optional(),
  bankName: z.string().trim().optional(),
  jazzcashNumber: z.string().trim().optional(),
  easypaisaNumber: z.string().trim().optional(),
  instructions: z.string().trim().optional(),
});

/** PATCH /api/admin/manual-payment-settings — update the payment instructions shown to sellers. */
export const updateManualPaymentSettings = asyncHandler(async (req: Request, res: Response) => {
  const data = settingsSchema.parse(req.body);
  const settings = await Settings.findOneAndUpdate(
    { key: "manual-payment" },
    { $set: data },
    { upsert: true, new: true }
  );
  res.json(settings.toJSON());
});

/* --------------------------- Seller requests ------------------------------ */

const createRequestSchema = z.object({
  planId: z.enum(["starter", "basic", "growth", "pro"]),
  method: z.enum(["bank", "jazzcash", "easypaisa"]),
  reference: z.string().min(3, "Enter the transaction ID / reference number"),
  proofUrl: z.string().optional(),
});

/** POST /api/seller/subscription/manual-request — submit a manual payment for admin review. */
export const createPaymentRequest = asyncHandler(async (req: Request, res: Response) => {
  const seller = await currentSeller(req);
  const data = createRequestSchema.parse(req.body);
  const plan = getPlan(data.planId);

  const request = await PaymentRequest.create({
    sellerId: seller._id,
    planId: data.planId,
    amount: plan.price,
    method: data.method,
    reference: data.reference,
    proofUrl: data.proofUrl,
    status: "pending",
  });

  res.status(201).json(request.toJSON());
});

/** GET /api/seller/subscription/manual-requests — the seller's own manual payment requests. */
export const getMyPaymentRequests = asyncHandler(async (req: Request, res: Response) => {
  const seller = await currentSeller(req);
  const requests = await PaymentRequest.find({ sellerId: seller._id }).sort({ createdAt: -1 });
  res.json(requests.map((r) => r.toJSON()));
});

/* ----------------------------- Admin review -------------------------------- */

/** GET /api/admin/payment-requests — all manual payment requests. */
export const getAllPaymentRequests = asyncHandler(async (_req: Request, res: Response) => {
  const requests = await PaymentRequest.find().sort({ createdAt: -1 });
  const sellerIds = [...new Set(requests.map((r) => r.sellerId.toString()))];
  const sellers = await Seller.find({ _id: { $in: sellerIds } }).select("name email phone");
  const sellerById = new Map(sellers.map((s) => [s.id, s]));
  res.json(
    requests.map((r) => ({
      ...r.toJSON(),
      sellerName: sellerById.get(r.sellerId.toString())?.name ?? "Unknown seller",
      sellerEmail: sellerById.get(r.sellerId.toString())?.email ?? "",
    }))
  );
});

const reviewSchema = z.object({
  status: z.enum(["approved", "rejected"]),
  reviewNote: z.string().optional(),
});

/** PATCH /api/admin/payment-requests/:id — approve or reject a manual payment request. */
export const reviewPaymentRequest = asyncHandler(async (req: Request, res: Response) => {
  const data = reviewSchema.parse(req.body);
  const request = await PaymentRequest.findById(req.params.id);
  if (!request) throw new ApiError(404, "Payment request not found");
  if (request.status !== "pending") throw new ApiError(400, "This request has already been reviewed");

  request.status = data.status;
  request.reviewNote = data.reviewNote;
  await request.save();

  if (data.status === "approved") {
    const seller = await Seller.findById(request.sellerId);
    if (!seller) throw new ApiError(404, "Seller not found");

    const plan = getPlan(request.planId as Parameters<typeof getPlan>[0]);
    const now = new Date();
    seller.planId = request.planId as typeof seller.planId;
    seller.subscriptionStatus = "active";
    seller.subscriptionStartedAt = now;
    seller.subscriptionEndsAt = addBillingPeriod(now);
    seller.autoRenew = false;
    await seller.save();

    await Payment.create({
      sellerId: seller._id,
      planId: request.planId,
      amount: plan.price,
      method: request.method,
      paidAt: now,
      notes: `Manual payment approved (ref: ${request.reference})`,
    });

    if (seller.storeId) {
      await Store.updateOne({ _id: seller.storeId }, { status: "active" });
    }
  }

  res.json(request.toJSON());
});
