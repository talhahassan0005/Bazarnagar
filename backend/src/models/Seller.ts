import { Schema, model, type Document, type Types } from "mongoose";
import bcrypt from "bcryptjs";
import { baseSchemaOptions } from "./_base";

export type SellerStatus = "pending" | "active" | "inactive" | "suspended";
export type SubscriptionStatus =
  | "trial"
  | "active"
  | "expired"
  | "suspended"
  | "cancelled";
export type PlanId = "starter" | "basic" | "growth" | "pro";

export interface SellerDoc extends Document {
  name: string;
  phone: string;
  email: string;
  passwordHash: string;
  status: SellerStatus;
  planId: PlanId;
  subscriptionStatus: SubscriptionStatus;
  subscriptionStartedAt?: Date;
  subscriptionEndsAt?: Date;
  autoRenew: boolean;
  retryCount: number;
  /** Saved Stripe customer + payment method, used for off-session auto-renewal charges. */
  stripeCustomerId?: string;
  stripePaymentMethodId?: string;
  storeId: Types.ObjectId | null;
  /** KYC — submitted while status is "pending", reviewed by an admin. */
  kycCnicFront?: string;
  kycCnicBack?: string;
  kycSubmittedAt?: Date;
  kycRejectionReason?: string;
  createdAt: Date;
  comparePassword(plain: string): Promise<boolean>;
}

const sellerSchema = new Schema<SellerDoc>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
    status: {
      type: String,
      enum: ["pending", "active", "inactive", "suspended"],
      default: "pending",
    },
    planId: {
      type: String,
      enum: ["starter", "basic", "growth", "pro"],
      default: "starter",
    },
    subscriptionStatus: {
      type: String,
      enum: ["trial", "active", "expired", "suspended", "cancelled"],
      default: "trial",
    },
    subscriptionStartedAt: Date,
    subscriptionEndsAt: { type: Date, index: true },
    autoRenew: { type: Boolean, default: false },
    retryCount: { type: Number, default: 0 },
    stripeCustomerId: { type: String },
    stripePaymentMethodId: { type: String },
    storeId: { type: Schema.Types.ObjectId, ref: "Store", default: null },
    kycCnicFront: { type: String },
    kycCnicBack: { type: String },
    kycSubmittedAt: { type: Date },
    kycRejectionReason: { type: String },
  },
  baseSchemaOptions
);

sellerSchema.methods.comparePassword = function (plain: string) {
  return bcrypt.compare(plain, this.passwordHash);
};

export const Seller = model<SellerDoc>("Seller", sellerSchema);
