import { Schema, model, type Document } from "mongoose";
import { baseSchemaOptions } from "./_base";

export type AdPlacementSource = "manual" | "adsense" | "off";
export type AdPlacementKey = "top" | "bottom" | "sidebar";

export interface AdPlacementConfig {
  source: AdPlacementSource;
  /** Google AdSense ad-unit slot id — only meaningful when source is "adsense". */
  adsenseSlotId?: string;
}

/** Singleton document — admin-chosen ad source (manual banner vs Google AdSense) per slot. */
export interface AdSettingsDoc extends Document {
  key: "ad-settings";
  adsenseEnabled: boolean;
  adsensePublisherId?: string;
  placements: {
    top: AdPlacementConfig;
    bottom: AdPlacementConfig;
    sidebar: AdPlacementConfig;
  };
}

const placementSchema = new Schema<AdPlacementConfig>(
  {
    source: { type: String, enum: ["manual", "adsense", "off"], default: "manual" },
    adsenseSlotId: String,
  },
  { _id: false }
);

const adSettingsSchema = new Schema<AdSettingsDoc>(
  {
    key: { type: String, required: true, unique: true, default: "ad-settings" },
    adsenseEnabled: { type: Boolean, default: false },
    adsensePublisherId: String,
    placements: {
      top: { type: placementSchema, default: () => ({ source: "manual" }) },
      bottom: { type: placementSchema, default: () => ({ source: "manual" }) },
      sidebar: { type: placementSchema, default: () => ({ source: "manual" }) },
    },
  },
  baseSchemaOptions
);

export const AdSettings = model<AdSettingsDoc>("AdSettings", adSettingsSchema);
