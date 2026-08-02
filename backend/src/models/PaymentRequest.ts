import { Schema, model, type Document, type Types } from "mongoose";
import { baseSchemaOptions } from "./_base";

export type PaymentRequestStatus = "pending" | "approved" | "rejected";
export type PaymentRequestMethod = "bank" | "jazzcash" | "easypaisa";

/**
 * A seller-submitted manual subscription payment (bank transfer / JazzCash /
 * EasyPaisa) awaiting admin verification — the alternative to paying by
 * card via Stripe.
 */
export interface PaymentRequestDoc extends Document {
  sellerId: Types.ObjectId;
  planId: string;
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
    planId: { type: String, required: true },
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
