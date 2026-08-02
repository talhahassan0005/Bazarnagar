import { Schema, model, type Document } from "mongoose";
import { baseSchemaOptions } from "./_base";

/** Singleton document — admin-editable platform settings. */
export interface SettingsDoc extends Document {
  key: "manual-payment";
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
  },
  baseSchemaOptions
);

export const Settings = model<SettingsDoc>("Settings", settingsSchema);
