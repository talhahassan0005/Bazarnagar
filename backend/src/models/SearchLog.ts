import { Schema, model, type Document, type Types } from "mongoose";
import { baseSchemaOptions } from "./_base";

/** Matched products stored per search — enough for "searches per product". */
export const SEARCH_LOG_MAX_PRODUCTS = 100;

/**
 * One keyword search by a shopper (admin search insights): what they typed,
 * which filters, how many results, and which products came back.
 */
export interface SearchLogDoc extends Document {
  /** Normalised: trimmed, lower-case, single-spaced. */
  query: string;
  category?: string;
  city?: string;
  resultCount: number;
  productIds: Types.ObjectId[];
  createdAt: Date;
}

const searchLogSchema = new Schema<SearchLogDoc>(
  {
    query: { type: String, required: true, index: true },
    category: String,
    city: String,
    resultCount: { type: Number, required: true, min: 0 },
    productIds: { type: [Schema.Types.ObjectId], default: [] },
  },
  baseSchemaOptions
);

searchLogSchema.index({ createdAt: -1 });

export const SearchLog = model<SearchLogDoc>("SearchLog", searchLogSchema);
