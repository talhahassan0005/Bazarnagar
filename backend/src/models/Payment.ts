import { Schema, model, type Document, type Types } from "mongoose";
import { baseSchemaOptions } from "./_base";

/** Manual subscription payment record (SRS §13.4). */
export interface PaymentDoc extends Document {
  sellerId: Types.ObjectId;
  planId: string;
  amount: number;
  method: string;
  paidAt: Date;
  notes?: string;
}

const paymentSchema = new Schema<PaymentDoc>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller", required: true, index: true },
    planId: { type: String, required: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, required: true },
    paidAt: { type: Date, default: () => new Date() },
    notes: String,
  },
  baseSchemaOptions
);

export const Payment = model<PaymentDoc>("Payment", paymentSchema);
