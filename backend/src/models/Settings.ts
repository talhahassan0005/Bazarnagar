import { Schema, model, type Document } from "mongoose";
import { baseSchemaOptions } from "./_base";

/** Singleton document — admin-editable platform settings. */
export interface SettingsDoc extends Document {
  key: "manual-payment" | "subscription" | "payment";
  /* key "payment": tax % added to USD plan payments (see lib/paymentPricing) */
  usdTaxPercent?: number;
  cardFeePercent?: number;
  /* key "subscription": what happens when a paid plan expires (see lib/subscriptionSettings) */
  downgradeAfterExpiry?: boolean;
  graceDays?: number;
  bankAccountTitle?: string;
  bankAccountNumber?: string;
  bankName?: string;
  jazzcashNumber?: string;
  easypaisaNumber?: string;
  instructions?: string;
}

const settingsSchema = new Schema<SettingsDoc>(
  {
    key: { type: String, required: true, unique: true, default: "manual-payment" },
    bankAccountTitle: String,
    bankAccountNumber: String,
    bankName: String,
    jazzcashNumber: String,
    easypaisaNumber: String,
    instructions: String,
    downgradeAfterExpiry: Boolean,
    graceDays: Number,
    usdTaxPercent: Number,
    cardFeePercent: Number,
  },
  baseSchemaOptions
);

export const Settings = model<SettingsDoc>("Settings", settingsSchema);
