import { Schema, model, type Document, type Types } from "mongoose";
import { baseSchemaOptions } from "./_base";

/** Social links a seller can add to their store profile. */
export const SOCIAL_PLATFORMS = [
  "website",
  "instagram",
  "facebook",
  "youtube",
  "tiktok",
  "linkedin",
  "twitter",
  "reddit",
  "discord",
] as const;
export type SocialPlatform = (typeof SOCIAL_PLATFORMS)[number];

/** One shopper tap on a store's social link — counted by day for the seller and admin. */
export interface SocialClickDoc extends Document {
  storeId: Types.ObjectId;
  platform: SocialPlatform;
  createdAt: Date;
}

const socialClickSchema = new Schema<SocialClickDoc>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true },
    platform: { type: String, enum: SOCIAL_PLATFORMS, required: true },
  },
  baseSchemaOptions
);

socialClickSchema.index({ storeId: 1, createdAt: -1 });
socialClickSchema.index({ createdAt: -1 });

export const SocialClick = model<SocialClickDoc>("SocialClick", socialClickSchema);
