import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import type { Product } from "./types";

/** Merge Tailwind classes safely (resolves conflicting utilities). */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
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
