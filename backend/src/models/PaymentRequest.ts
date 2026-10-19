import { Schema, model, type Document, type Types } from "mongoose";
import { baseSchemaOptions } from "./_base";

export type PaymentRequestStatus = "pending" | "approved" | "rejected";
export type PaymentRequestMethod = "bank" | "jazzcash" | "easypaisa";

export type PaymentRequestPurpose = "plan" | "boost";

/**
 * A seller-submitted manual payment (bank transfer / JazzCash / EasyPaisa).
 * Plan payments wait for admin approval before the plan changes. Boost
 * payments activate the boost immediately; the admin can later verify them,
 * or reject one (which removes that boost) if the money never arrived.
 */
export interface PaymentRequestDoc extends Document {
  sellerId: Types.ObjectId;
  purpose: PaymentRequestPurpose;
  /** Plan payments only. */
  planId?: string;
  /** Boost payments only: which product, for how many days. */
  productId?: Types.ObjectId;
  days?: number;
  amount: number;
  method: PaymentRequestMethod;
  reference: string;
  proofUrl?: string;
  status: PaymentRequestStatus;
  reviewNote?: string;
  createdAt: Date;
}

const paymentRequestSchema = new Schema<PaymentRequestDoc>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller", required: true, index: true },
    purpose: { type: String, enum: ["plan", "boost"], default: "plan" },
    planId: String,
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    days: { type: Number, min: 1 },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, enum: ["bank", "jazzcash", "easypaisa"], required: true },
    reference: { type: String, required: true, trim: true },
    proofUrl: String,
    status: { type: String, enum: ["pending", "approved", "rejected"], default: "pending", index: true },
    reviewNote: String,
  },
  baseSchemaOptions
);

export const PaymentRequest = model<PaymentRequestDoc>("PaymentRequest", paymentRequestSchema);
