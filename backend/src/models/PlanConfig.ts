import { Schema, model } from "mongoose";
import type { PlanId } from "./Seller";
import { baseSchemaOptions } from "./_base";

export interface IPlanConfig {
  planId: PlanId;
  price: number;
  productLimit: number;
  imageLimit: number;
  videoLimit: number;
}

const planConfigSchema = new Schema<IPlanConfig>(
  {
    planId: { type: String, required: true, unique: true },
    price: { type: Number, required: true },
    productLimit: { type: Number, required: true },
    imageLimit: { type: Number, required: true },
    videoLimit: { type: Number, required: true },
  },
  baseSchemaOptions
);

export const PlanConfig = model<IPlanConfig>("PlanConfig", planConfigSchema);
