import { Schema, model, type Document, type Types } from "mongoose";
import { baseSchemaOptions } from "./_base";

export type StoreStatus = "active" | "inactive" | "pending";
export type StoreTheme = "brand" | "emerald" | "rose" | "amber" | "dark";

/** Seller-customizable landing page config (mirrors frontend StoreLanding). */
export interface StoreLanding {
  enabled: boolean;
  theme: StoreTheme;
  headline?: string;
  tagline?: string;
  heroImageUrl?: string;
  primaryCtaLabel?: string;
  showFeatured: boolean;
  featuredProductIds: string[];
  showAbout: boolean;
  aboutTitle?: string;
  aboutText?: string;
  showContact: boolean;
}

/** Seller's payout details — where the seller receives their earnings. */
export interface StorePayout {
  method: "easypaisa" | "jazzcash" | "bank";
  accountTitle: string; // account holder's name
  accountNumber: string; // mobile number (wallets) or account/IBAN (bank)
  bankName?: string; // only for bank transfers
  /** Set once valid details are saved — the account is "connected". */
  connectedAt?: Date;
}

export interface StoreDoc extends Document {
  sellerId: Types.ObjectId;
  name: string;
  slug: string;
  logoUrl?: string;
  coverUrl?: string;
  description: string;
  category: string;
  whatsapp: string;
  city: string;
  area?: string;
  fullAddress?: string;
  mapsLink?: string;
  lat?: number;
  lng?: number;
  showLocation: boolean;
  showInSearch: boolean;
  isOpen: boolean;
  socials?: { instagram?: string; facebook?: string; tiktok?: string };
  deliveryInfo?: string;
  paymentInfo?: string;
  landing?: StoreLanding;
  payout?: StorePayout;
  status: StoreStatus;
  views: number;
  whatsappClicks: number;
}

const landingSchema = new Schema<StoreLanding>(
  {
    enabled: { type: Boolean, default: true },
    theme: {
      type: String,
      enum: ["brand", "emerald", "rose", "amber", "dark"],
      default: "brand",
    },
    headline: String,
    tagline: String,
    heroImageUrl: String,
    primaryCtaLabel: String,
    showFeatured: { type: Boolean, default: true },
    featuredProductIds: { type: [String], default: [] },
    showAbout: { type: Boolean, default: true },
    aboutTitle: String,
    aboutText: String,
    showContact: { type: Boolean, default: true },
  },
  { _id: false }
);

const payoutSchema = new Schema<StorePayout>(
  {
    method: { type: String, enum: ["easypaisa", "jazzcash", "bank"], required: true },
    accountTitle: { type: String, required: true },
    accountNumber: { type: String, required: true },
    bankName: String,
    connectedAt: Date,
  },
  { _id: false }
);

const storeSchema = new Schema<StoreDoc>(
  {
    sellerId: { type: Schema.Types.ObjectId, ref: "Seller", required: true, index: true },
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    logoUrl: String,
    coverUrl: String,
    description: { type: String, required: true },
    category: { type: String, required: true },
    whatsapp: { type: String, required: true },
    city: { type: String, required: true, index: true },
    area: { type: String, index: true },
    fullAddress: String,
    mapsLink: String,
    lat: Number,
    lng: Number,
    showLocation: { type: Boolean, default: true },
    showInSearch: { type: Boolean, default: true },
    isOpen: { type: Boolean, default: true },
    socials: {
      instagram: String,
      facebook: String,
      tiktok: String,
    },
    deliveryInfo: String,
    paymentInfo: String,
    landing: { type: landingSchema, default: undefined },
    payout: { type: payoutSchema, default: undefined },
    status: {
      type: String,
      enum: ["active", "inactive", "pending"],
      default: "active",
    },
    views: { type: Number, default: 0 },
    whatsappClicks: { type: Number, default: 0 },
  },
  baseSchemaOptions
);

export const Store = model<StoreDoc>("Store", storeSchema);
