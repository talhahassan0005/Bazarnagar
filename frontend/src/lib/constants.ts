import type { ModerationStatus, Plan, PlanId } from "./types";

/** A product limit at/above this counts as "unlimited" (paid plans). */
export const UNLIMITED = 1_000_000;

/** Subscription plans (SRS §6). */
export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Starter",
    price: 100,
    productLimit: 5,
    imageLimit: 1,
    videoLimit: 0,
    highlights: ["5 products", "1 image per product", "Public shop link"],
  },
  basic: {
    id: "basic",
    name: "Basic",
    price: 500,
    productLimit: UNLIMITED,
    imageLimit: 3,
    videoLimit: 0,
    highlights: ["Unlimited products", "3 images per product", "Public product search"],
  },
  growth: {
    id: "growth",
    name: "Growth",
    price: 1000,
    productLimit: UNLIMITED,
    imageLimit: 5,
    videoLimit: 1,
    highlights: ["Unlimited products", "5 images per product", "1 video per product"],
  },
  pro: {
    id: "pro",
    name: "Pro",
    price: 5000,
    productLimit: UNLIMITED,
    imageLimit: 8,
    videoLimit: 2,
    highlights: ["Unlimited products", "8 images per product", "2 videos per product"],
  },
};

export const PLAN_LIST: Plan[] = Object.values(PLANS);

/** Featured-product "boost" packages — configurable rates (mirror backend/lib/boost.ts). */
export interface BoostPackage {
  id: string;
  label: string;
  days: number;
  price: number;
}

export const BOOST_PACKAGES: BoostPackage[] = [
  { id: "boost7", label: "7 days", days: 7, price: 500 },
  { id: "boost15", label: "15 days", days: 15, price: 900 },
  { id: "boost30", label: "30 days", days: 30, price: 1500 },
];

/** Business / product categories (SRS §5.3 / §5.4). */
export const CATEGORIES = [
  "Clothing",
  "Cosmetics",
  "Food",
  "Electronics",
  "Home & Living",
  "Accessories",
  "Shoes",
  "Health",
  "Toys",
  "Books",
  "Other",
] as const;

/** Common Pakistani cities for the location selector. */
export const CITIES = [
  "Lahore",
  "Karachi",
  "Islamabad",
  "Rawalpindi",
  "Faisalabad",
  "Multan",
  "Peshawar",
  "Quetta",
  "Sialkot",
  "Gujranwala",
] as const;

/** Display metadata for moderation statuses (SRS §12). */
export const MODERATION_META: Record<
  ModerationStatus,
  { label: string; tone: "amber" | "green" | "red" | "blue" | "orange"; meaning: string }
> = {
  pending: {
    label: "Pending Review",
    tone: "amber",
    meaning: "Product uploaded but not checked",
  },
  approved: {
    label: "Approved",
    tone: "green",
    meaning: "Product can go public",
  },
  flagged: {
    label: "Flagged",
    tone: "orange",
    meaning: "Product needs admin review",
  },
  rejected: {
    label: "Rejected",
    tone: "red",
    meaning: "Product cannot go public",
  },
  needs_edit: {
    label: "Needs Edit",
    tone: "blue",
    meaning: "Seller must update product",
  },
};

export const SITE_NAME = "Bazaarnagar";
export const SITE_TAGLINE = "Your shop, in one link.";
/** Urdu tagline from the logo. */
export const SITE_TAGLINE_UR = "آپ کی دکان، ایک لنک میں";
export const SITE_DOMAIN = "bazaarnagar.com";
