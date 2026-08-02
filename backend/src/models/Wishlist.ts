import { Schema, model, type Document, type Types } from "mongoose";
import { baseSchemaOptions } from "./_base";

export interface WishlistItemDoc extends Document {
  customerId: Types.ObjectId;
  productId: Types.ObjectId;
  createdAt: Date;
}

const wishlistItemSchema = new Schema<WishlistItemDoc>(
  {
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true },
  },
  baseSchemaOptions
);

wishlistItemSchema.index({ customerId: 1, productId: 1 }, { unique: true });

export const WishlistItem = model<WishlistItemDoc>("WishlistItem", wishlistItemSchema);
