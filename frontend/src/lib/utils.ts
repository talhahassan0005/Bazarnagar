import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Product } from "./types";

/** Merge Tailwind classes safely (resolves conflicting utilities). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Pull a human-readable message out of any thrown/rejected value — an Error,
 * an RTK Query error (`{ message }` / `{ error }`), or a nested API body —
 * falling back to a friendly default. Use in catch blocks so end users always
 * see why something failed.
 */
export function getErrorMessage(err: unknown, fallback = "Something went wrong"): string {
  if (typeof err === "string") return err || fallback;
  if (err instanceof Error) return err.message || fallback;
  if (err && typeof err === "object") {
    const e = err as Record<string, unknown>;
    if (typeof e.message === "string" && e.message) return e.message;
    if (typeof e.error === "string" && e.error) return e.error;
    const data = e.data as Record<string, unknown> | undefined;
    if (data) {
      if (typeof data.message === "string" && data.message) return data.message;
      if (typeof data.error === "string" && data.error) return data.error;
    }
  }
  return fallback;
}

/** Great-circle distance between two lat/lng points, in kilometres. */
export function distanceKm(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const R = 6371; // Earth radius (km)
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/** Human-friendly distance, e.g. 0.4 -> "400 m", 3.2 -> "3.2 km". */
export function formatDistance(km: number): string {
  if (km < 1) return `${Math.round(km * 1000)} m`;
  return `${km < 10 ? km.toFixed(1) : Math.round(km)} km`;
}

/** Format a number as PKR currency, e.g. 2500 -> "Rs. 2,500". */
export function formatPrice(value: number): string {
  return `Rs. ${value.toLocaleString("en-PK")}`;
}

/** Compact number for analytics, e.g. 1500 -> "1.5k". */
export function formatCount(value: number): string {
  if (value < 1000) return String(value);
  if (value < 1_000_000) return `${(value / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return `${(value / 1_000_000).toFixed(1).replace(/\.0$/, "")}m`;
}

/** Build a URL-friendly slug from a store name. */
export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

/** Normalize a Pakistani phone number to wa.me format (digits only, with country code). */
export function toWhatsAppNumber(phone: string): string {
  let digits = phone.replace(/\D/g, "");
  if (digits.startsWith("0")) digits = `92${digits.slice(1)}`;
  if (!digits.startsWith("92")) digits = `92${digits}`;
  return digits;
}

/**
 * Build a WhatsApp inquiry link with a pre-filled message (SRS §8).
 * Uses the negotiable template when the product is marked negotiable.
 */
export function buildWhatsAppLink(opts: {
  phone: string;
  productName: string;
  price: number;
  negotiable: boolean;
  productLink: string;
}): string {
  const { phone, productName, price, negotiable, productLink } = opts;
  const availability = negotiable
    ? "Is it available and negotiable?"
    : "Is it available?";
  const message = [
    `Hi, I am interested in this product: ${productName}`,
    `Price: ${formatPrice(price)}`,
    availability,
    `Product link: ${productLink}`,
  ].join("\n");
  return `https://wa.me/${toWhatsAppNumber(phone)}?text=${encodeURIComponent(message)}`;
}

/** Whether a product is currently boosted (featured). */
export function isBoosted(p: { boostedUntil?: string }): boolean {
  return p.boostedUntil ? new Date(p.boostedUntil).getTime() > Date.now() : false;
}

/** The price actually charged (discount if present and lower than price). */
export function effectivePrice(product: Pick<Product, "price" | "discountPrice">): number {
  if (product.discountPrice && product.discountPrice < product.price) {
    return product.discountPrice;
  }
  return product.price;
}

/** Discount percentage, or null when there is no valid discount. */
export function discountPercent(
  product: Pick<Product, "price" | "discountPrice">
): number | null {
  if (!product.discountPrice || product.discountPrice >= product.price) return null;
  return Math.round((1 - product.discountPrice / product.price) * 100);
}
