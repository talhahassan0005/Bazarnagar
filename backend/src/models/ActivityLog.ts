import { Schema, model, type Document, type Types } from "mongoose";
import { baseSchemaOptions } from "./_base";

export type ActivityType = "store.created" | "product.created";

/**
 * Snapshot of the store/product at the time of the event, so the log stays
 * readable even after the store or product is edited or deleted.
 */
export interface ActivitySnapshot {
  sellerName?: string;
  sellerEmail?: string;
  storeName?: string;
  storeSlug?: string;
  city?: string;
  category?: string;
  productName?: string;
  price?: number;
}

/** Admin-visible audit trail of store creations and product additions. */
export interface ActivityLogDoc extends Document {
  type: ActivityType;
  sellerId?: Types.ObjectId;
  storeId?: Types.ObjectId;
  productId?: Types.ObjectId;
  snapshot: ActivitySnapshot;
  createdAt: Date;
}

const activityLogSchema = new Schema<ActivityLogDoc>(
  {
    type: { type: String, enum: ["store.created", "product.created"], required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller", index: true },
    storeId: { type: Schema.Types.ObjectId, ref: "Store", index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    snapshot: {
      sellerName: String,
      sellerEmail: String,
      storeName: String,
      storeSlug: String,
      city: String,
      category: String,
      productName: String,
      price: Number,
    },
  },
  baseSchemaOptions
);

activityLogSchema.index({ createdAt: -1 });

export const ActivityLog = model<ActivityLogDoc>("ActivityLog", activityLogSchema);
