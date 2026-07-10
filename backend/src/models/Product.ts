import { Schema, model, type Document, type Types } from "mongoose";
import { baseSchemaOptions } from "./_base";

export type StockStatus = "in_stock" | "out_of_stock";
export type ProductStatus = "active" | "inactive";
export type ProductCondition = "new" | "used";
export type ModerationStatus =
  | "pending"
  | "approved"
  | "flagged"
  | "rejected"
  | "needs_edit";

export interface ProductDoc extends Document {
  storeId: Types.ObjectId;
  name: string;
  category: string;
  price: number;
  discountPrice?: number;
  images: string[];
  videoUrl?: string;
  description?: string;
  tags: string[];
  stockStatus: StockStatus;
  status: ProductStatus;
  negotiable: boolean;
  condition?: ProductCondition;
  deliveryAvailable?: boolean;
  /** Optional per-product location (falls back to the store's location). */
  lat?: number;
  lng?: number;
  moderationStatus: ModerationStatus;
  moderationReason?: string;
  /** Paid "boost" — product is featured while this date is in the future. */
  boostedUntil?: Date;
  views: number;
  whatsappClicks: number;
  createdAt: Date;
}

const productSchema = new Schema<ProductDoc>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
    name: { type: String, required: true, trim: true },
    category: { type: String, required: true, index: true },
    price: { type: Number, required: true, min: 0 },
    discountPrice: { type: Number, min: 0 },
    images: { type: [String], default: [] },
    videoUrl: String,
    description: String,
    tags: { type: [String], default: [] },
    stockStatus: {
      type: String,
      enum: ["in_stock", "out_of_stock"],
      default: "in_stock",
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    negotiable: { type: Boolean, default: false },
    condition: { type: String, enum: ["new", "used"] },
    deliveryAvailable: Boolean,
    lat: Number,
    lng: Number,
    moderationStatus: {
      type: String,
      enum: ["pending", "approved", "flagged", "rejected", "needs_edit"],
      default: "pending",
      index: true,
    },
    moderationReason: String,
    boostedUntil: { type: Date, index: true },
    views: { type: Number, default: 0 },
    whatsappClicks: { type: Number, default: 0 },
  },
  baseSchemaOptions
);

// Text index to support keyword search across the main fields (SRS §9).
productSchema.index({ name: "text", description: "text", tags: "text" });

export const Product = model<ProductDoc>("Product", productSchema);
