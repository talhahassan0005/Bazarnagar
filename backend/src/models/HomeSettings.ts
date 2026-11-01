import { Schema, model, type Document } from "mongoose";
import { baseSchemaOptions } from "./_base";

export interface HomeSettingsDoc extends Document {
  key: "home";
  /** Rows to show per category on the landing page (1–5). Missing = defaultRows. */
  categoryRows: Partial<Record<string, number>>;
  /** Default rows for categories not individually configured. */
  defaultRows: number;
}

const homeSettingsSchema = new Schema<HomeSettingsDoc>(
  {
    key: { type: String, required: true, unique: true, default: "home" },
    categoryRows: { type: Schema.Types.Mixed, default: {} },
    defaultRows: { type: Number, default: 1, min: 1, max: 5 },
  },
  baseSchemaOptions
);

export const HomeSettings = model<HomeSettingsDoc>("HomeSettings", homeSettingsSchema);

export async function getHomeSettingsData(): Promise<{ categoryRows: Record<string, number>; defaultRows: number }> {
  const doc = await HomeSettings.findOne({ key: "home" }).lean();
  return {
    categoryRows: (doc?.categoryRows ?? {}) as Record<string, number>,
    defaultRows: doc?.defaultRows ?? 1,
  };
}
