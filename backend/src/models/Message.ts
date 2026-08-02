import { Schema, model, type Document, type Types } from "mongoose";
import { baseSchemaOptions } from "./_base";

export type MessageSender = "customer" | "seller";

export interface MessageDoc extends Document {
  conversationId: Types.ObjectId;
  senderRole: MessageSender;
  text: string;
  createdAt: Date;
}

const messageSchema = new Schema<MessageDoc>(
  {
    conversationId: { type: Schema.Types.ObjectId, ref: "Conversation", required: true, index: true },
    senderRole: { type: String, enum: ["customer", "seller"], required: true },
    text: { type: String, required: true, trim: true, maxlength: 2000 },
  },
  baseSchemaOptions
);

export const Message = model<MessageDoc>("Message", messageSchema);
