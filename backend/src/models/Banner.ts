import { Schema, model, type Document } from "mongoose";
import { baseSchemaOptions } from "./_base";

/** Admin-managed banner ad shown on free (starter) plan shop pages. */
export interface BannerDoc extends Document {
  title?: string;
  imageUrl: string;
  linkUrl?: string;
  /** Target a specific store category (case-insensitive). Empty = shown on every store. */
  category?: string;
  active: boolean;
  order: number;
}

const bannerSchema = new Schema<BannerDoc>(
  {
    title: { type: String, trim: true },
    imageUrl: { type: String, required: true },
    linkUrl: { type: String, trim: true },
    category: { type: String, trim: true },
    active: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  baseSchemaOptions
);

export const Banner = model<BannerDoc>("Banner", bannerSchema);
