import { Schema, model } from "mongoose";
import type { PlanId } from "./Seller";
import { baseSchemaOptions } from "./_base";

export interface IPlanConfig {
  planId: PlanId;
  price: number;
  productLimit: number;
  imageLimit: number;
  videoLimit: number;
  enabled: boolean;
  /** Separate price for overseas sellers, in US dollars / month (0 = not offered). */
  priceUsd?: number;
  /** Pricing page card text — falls back to the built-in plan name / empty. */
  name?: string;
  tagline?: string;
  description?: string;
  features?: string[];
  /** Shown as the "Recommended" card on the pricing page. */
  highlighted?: boolean;
}

const planConfigSchema = new Schema<IPlanConfig>(
  {
    planId: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    productLimit: { type: Number, required: true },
    imageLimit: { type: Number, required: true },
    videoLimit: { type: Number, required: true },
    enabled: { type: Boolean, default: true },
    priceUsd: { type: Number, default: 0 },
    name: String,
    tagline: String,
    description: String,
    features: { type: [String], default: [] },
    highlighted: { type: Boolean, default: false },
  },
  baseSchemaOptions
);

export const PlanConfig = model<IPlanConfig>("PlanConfig", planConfigSchema);
