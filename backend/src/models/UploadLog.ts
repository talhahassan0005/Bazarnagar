import { Schema, model, type Document, type Types } from "mongoose";
import { baseSchemaOptions } from "./_base";

/**
 * One uploaded file. Summing `size` per seller gives each store's storage use
 * (a seller owns exactly one store, and may upload a logo before the store
 * exists — so uploads are attributed to the seller, not the store id).
 */
export interface UploadLogDoc extends Document {
  /** Object key in R2, or filename in the local uploads folder. */
  key: string;
  url: string;
  size: number;
  contentType: string;
  storage: "r2" | "local";
  uploaderRole: "seller" | "admin";
  /** Set for seller uploads; admin uploads (banner ads) have none. */
  sellerId?: Types.ObjectId;
  /** True for entries reconstructed from existing images by the backfill script. */
  backfilled?: boolean;
  createdAt: Date;
}

const uploadLogSchema = new Schema<UploadLogDoc>(
  {
    key: { type: String, required: true, unique: true },
    url: { type: String, required: true },
    size: { type: Number, required: true, min: 0 },
    contentType: { type: String, required: true },
    storage: { type: String, enum: ["r2", "local"], required: true },
    uploaderRole: { type: String, enum: ["seller", "admin"], required: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller", index: true },
    backfilled: Boolean,
  },
  baseSchemaOptions
);

export const UploadLog = model<UploadLogDoc>("UploadLog", uploadLogSchema);
