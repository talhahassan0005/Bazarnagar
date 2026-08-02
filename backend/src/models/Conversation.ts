import { Schema, model, type Document, type Types } from "mongoose";
import { baseSchemaOptions } from "./_base";

export interface ConversationDoc extends Document {
  storeId: Types.ObjectId;
  customerId: Types.ObjectId;
  /** The product the customer was viewing when they started the chat (context only). */
  productId?: Types.ObjectId;
  productName?: string;
  lastMessageText?: string;
  lastMessageAt?: Date;
  createdAt: Date;
}

const conversationSchema = new Schema<ConversationDoc>(
  {
    storeId: { type: Schema.Types.ObjectId, ref: "Store", required: true, index: true },
    customerId: { type: Schema.Types.ObjectId, ref: "Customer", required: true, index: true },
    productId: { type: Schema.Types.ObjectId, ref: "Product" },
    productName: String,
    lastMessageText: String,
    lastMessageAt: Date,
  },
  baseSchemaOptions
);

conversationSchema.index({ storeId: 1, customerId: 1 }, { unique: true });

export const Conversation = model<ConversationDoc>("Conversation", conversationSchema);
