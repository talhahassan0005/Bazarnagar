import { Schema, model, type Document } from "mongoose";
import { baseSchemaOptions } from "./_base";

/** Singleton — admin-set price for featuring ("boosting") a product, per day. */
export interface BoostPricingDoc extends Document {
  key: "boost";
  pricePerDay: number;
  minDays: number;
  maxDays: number;
}

const boostPricingSchema = new Schema<BoostPricingDoc>(
  {
    key: { type: String, required: true, unique: true, default: "boost" },
    pricePerDay: { type: Number, required: true, min: 0 },
    minDays: { type: Number, required: true, min: 1 },
    maxDays: { type: Number, required: true, min: 1 },
  },
  baseSchemaOptions
);

export const BoostPricing = model<BoostPricingDoc>("BoostPricing", boostPricingSchema);
