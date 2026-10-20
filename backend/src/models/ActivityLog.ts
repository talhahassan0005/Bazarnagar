import { Schema, model, type Document, type Types } from "mongoose";
import { baseSchemaOptions } from "./_base";

export type ActivityType = "store.created" | "product.created" | "buyer.registered";

/**
 * Snapshot of the store/product/buyer at the time of the event, so the log
 * stays readable even after it is edited or deleted.
 */
export interface ActivitySnapshot {
  sellerName?: string;
  sellerEmail?: string;
  buyerName?: string;
  buyerEmail?: string;
  storeName?: string;
  storeSlug?: string;
  city?: string;
  category?: string;
  productName?: string;
  price?: number;
}

/** Admin-visible audit trail of store creations, product additions and buyer signups. */
export interface ActivityLogDoc extends Document {
  type: ActivityType;
  sellerId?: Types.ObjectId;
  customerId?: Types.ObjectId;
  storeId?: Types.ObjectId;
  productId?: Types.ObjectId;
  snapshot: ActivitySnapshot;
  createdAt: Date;
}

const activityLogSchema = new Schema<ActivityLogDoc>(
  {
    type: { type: String, enum: ["store.created", "product.created", "buyer.registered"], required: true, index: true },
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller", index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", index: true },
    storeId: { type: Schema.Types.ObjectId, ref: "Store", index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    snapshot: {
      sellerName: String,
      sellerEmail: String,
      buyerName: String,
      buyerEmail: String,
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
