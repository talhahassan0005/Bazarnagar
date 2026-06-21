import { Schema, model, type Document, type Types } from "mongoose";
import { baseSchemaOptions } from "./_base";

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface ReviewDoc extends Document {
  productId: Types.ObjectId;
  storeId: Types.ObjectId;
  customerName: string;
  rating: number; // 1–5
  comment?: string;
  status: ReviewStatus;
  createdAt: Date;
}

const reviewSchema = new Schema<ReviewDoc>(
  {
    productId: { type: Schema.Types.ObjectId, ref: "Product", required: true, index: true },
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
    customerName: { type: String, required: true, trim: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    comment: { type: String, trim: true },
    status: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
      index: true,
    },
  },
  baseSchemaOptions
);

export const Review = model<ReviewDoc>("Review", reviewSchema);
