import { Schema, model, type Document, type Types } from "mongoose";
import bcrypt from "bcryptjs";
import { baseSchemaOptions } from "./_base";

export type SellerStatus = "active" | "inactive" | "suspended";
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
  storeId: Types.ObjectId | null;
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
      enum: ["active", "inactive", "suspended"],
      default: "active",
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
    storeId: { type: Schema.Types.ObjectId, ref: "Store", default: null },
  },
  baseSchemaOptions
);

sellerSchema.methods.comparePassword = function (plain: string) {
  return bcrypt.compare(plain, this.passwordHash);
};

export const Seller = model<SellerDoc>("Seller", sellerSchema);
