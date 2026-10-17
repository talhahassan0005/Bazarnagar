import { Schema, model, type Document, type Types } from "mongoose";
import { baseSchemaOptions } from "./_base";

export type ResetAccountType = "seller" | "customer";

/**
 * A pending "forgot password" request. Only a SHA-256 hash of the emailed
 * token is stored, and MongoDB deletes the document once it expires.
 */
export interface PasswordResetDoc extends Document {
  accountType: ResetAccountType;
  accountId: Types.ObjectId;
  tokenHash: string;
  expiresAt: Date;
}

const passwordResetSchema = new Schema<PasswordResetDoc>(
  {
    accountType: { type: String, enum: ["seller", "customer"], required: true },
    accountId: { type: Schema.Types.ObjectId, required: true, index: true },
    tokenHash: { type: String, required: true, unique: true },
    expiresAt: { type: Date, required: true },
  },
  baseSchemaOptions
);

// TTL index — MongoDB removes expired reset requests automatically.
passwordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const PasswordReset = model<PasswordResetDoc>("PasswordReset", passwordResetSchema);
