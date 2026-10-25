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
  /* USD payments from outside Pakistan: Payoneer receiving (US bank) account */
  usdBankName?: string;
  usdBankAddress?: string;
  usdRoutingNumber?: string;
  usdSwiftCode?: string;
  usdAccountNumber?: string;
  usdAccountType?: string;
  usdBeneficiaryName?: string;
  /** Optional Payoneer payment request link. */
  payoneerLink?: string;
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
    usdBankName: String,
    usdBankAddress: String,
    usdRoutingNumber: String,
    usdSwiftCode: String,
    usdAccountNumber: String,
    usdAccountType: String,
    usdBeneficiaryName: String,
    payoneerLink: String,
    downgradeAfterExpiry: Boolean,
    graceDays: Number,
    usdTaxPercent: Number,
    cardFeePercent: Number,
  },
  baseSchemaOptions
);

export const Settings = model<SettingsDoc>("Settings", settingsSchema);
