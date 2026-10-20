import { Schema, model, type Document } from "mongoose";
import bcrypt from "bcryptjs";
import { baseSchemaOptions } from "./_base";

export interface CustomerDoc extends Document {
  name: string;
  phone: string;
  email: string;
  /** Picked at signup. Missing on accounts created before the field existed. */
  country?: string;
  passwordHash: string;
  /** Last successful sign-in (or signup). Missing for accounts that haven't logged in since it was added. */
  lastLoginAt?: Date;
  createdAt: Date;
  comparePassword(plain: string): Promise<boolean>;
}

const customerSchema = new Schema<CustomerDoc>(
  {
    name: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    country: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    lastLoginAt: Date,
  },
  baseSchemaOptions
);

customerSchema.methods.comparePassword = function (plain: string) {
  return bcrypt.compare(plain, this.passwordHash);
};

export const Customer = model<CustomerDoc>("Customer", customerSchema);
