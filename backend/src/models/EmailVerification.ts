import { Schema, model, type Document, type Types } from "mongoose";
import { baseSchemaOptions } from "./_base";

/**
 * A pending "verify your email" link for a new seller. Only a SHA-256 hash
 * of the emailed token is stored, and MongoDB deletes it once it expires.
 */
export interface EmailVerificationDoc extends Document {
  sellerId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
  createdAt: Date;
}

const emailVerificationSchema = new Schema<EmailVerificationDoc>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller", required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  baseSchemaOptions
);

// TTL index — MongoDB removes expired links automatically.
emailVerificationSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const EmailVerification = model<EmailVerificationDoc>("EmailVerification", emailVerificationSchema);
