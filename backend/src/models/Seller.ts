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
  /** Picked at signup. Missing on accounts created before the field existed. */
  country?: string;
  passwordHash: string;
  /** false until the seller clicks the emailed link. Missing on accounts from before verification existed (treated as verified). */
  emailVerified?: boolean;
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
  /** Plan-expiry warning emails sent since the plan expired (reset on renewal). */
  expiryWarningsSent?: number;
  /** Paid plan the seller was moved to Free from, when it lapsed. */
  downgradedFromPlanId?: PlanId;
  createdAt: Date;
  comparePassword(plain: string): Promise<boolean>;
}

const sellerSchema = new Schema<SellerDoc>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    country: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    emailVerified: Boolean,
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
    expiryWarningsSent: { type: Number, default: 0 },
    downgradedFromPlanId: { type: String },
  },
  baseSchemaOptions
);

// A plan change (upgrade, renewal, move to Free) re-checks which products are
// public; a fresh active subscription clears old expiry warnings.
sellerSchema.pre("save", function () {
  this.$locals.planChanged = this.isModified("planId");
  if (this.isModified("subscriptionStatus") && this.subscriptionStatus === "active" && this.planId !== "starter") {
    this.expiryWarningsSent = 0;
    this.downgradedFromPlanId = undefined;
  }
});
sellerSchema.post("save", async function (doc) {
  if (!doc.$locals.planChanged) return;
  try {
    const { syncPlanVisibility } = await import("../lib/planVisibility");
    await syncPlanVisibility(doc);
  } catch (err) {
    console.error("Failed to sync product visibility:", err);
  }
});

sellerSchema.methods.comparePassword = function (plain: string) {
  return bcrypt.compare(plain, this.passwordHash);
};

export const Seller = model<SellerDoc>("Seller", sellerSchema);
