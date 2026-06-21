import type { SchemaOptions } from "mongoose";

/**
 * Shared schema options so every model serialises the same way the frontend
 * expects: `_id` becomes `id` (string), and `__v` / sensitive fields are
 * stripped. This keeps API responses matching `frontend/src/lib/types.ts`.
 *
 * Typed as `SchemaOptions<any>` so the same object is assignable to every
 * model's `new Schema<TDoc>(...)` call regardless of its document type.
 */
export const baseSchemaOptions: SchemaOptions<any> = {
  timestamps: true,
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform(_doc, ret: Record<string, unknown>) {
      ret.id = ret._id?.toString();
      delete ret._id;
      delete ret.passwordHash;
      return ret;
    },
  },
  toObject: { virtuals: true, versionKey: false },
};
