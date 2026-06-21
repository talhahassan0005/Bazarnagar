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
  moderationStatus: ModerationStatus;
  moderationReason?: string;
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
    moderationStatus: {
      type: String,
      enum: ["pending", "approved", "flagged", "rejected", "needs_edit"],
      default: "pending",
      index: true,
    },
    moderationReason: String,
    views: { type: Number, default: 0 },
    whatsappClicks: { type: Number, default: 0 },
  },
  baseSchemaOptions
);

// Text index to support keyword search across the main fields (SRS §9).
productSchema.index({ name: "text", description: "text", tags: "text" });

export const Product = model<ProductDoc>("Product", productSchema);
