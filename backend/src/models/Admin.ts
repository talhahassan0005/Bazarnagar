import { Schema, model, type Document } from "mongoose";
import bcrypt from "bcryptjs";
import { baseSchemaOptions } from "./_base";

export interface AdminDoc extends Document {
  name: string;
  email: string;
  passwordHash: string;
  comparePassword(plain: string): Promise<boolean>;
}

const adminSchema = new Schema<AdminDoc>(
  {
    name: { type: String, required: true, default: "Admin" },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    passwordHash: { type: String, required: true },
  },
  baseSchemaOptions
);

adminSchema.methods.comparePassword = function (plain: string) {
  return bcrypt.compare(plain, this.passwordHash);
};

export const Admin = model<AdminDoc>("Admin", adminSchema);
