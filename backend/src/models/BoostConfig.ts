import { Schema, model } from "mongoose";
import { baseSchemaOptions } from "./_base";

export interface IBoostConfig {
  packageId: string;
  label: string;
  days: number;
  price: number;
  enabled: boolean;
}

const boostConfigSchema = new Schema<IBoostConfig>(
  {
    packageId: { type: String, required: true, unique: true },
    label: { type: String, required: true },
    days: { type: Number, required: true },
    price: { type: Number, required: true },
    enabled: { type: Boolean, default: true },
  },
  baseSchemaOptions
);

export const BoostConfig = model<IBoostConfig>("BoostConfig", boostConfigSchema);
