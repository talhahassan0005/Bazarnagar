import type { BoostPricing, ModerationStatus, Plan, PlanId } from "./types";

/** A product limit at/above this counts as "unlimited" (paid plans). */
export const UNLIMITED = 1_000_000;

/** Subscription plans. */
export const PLANS: Record<PlanId, Plan> = {
  starter: {
    id: "starter",
    name: "Free",
    price: 0,
    productLimit: 50,
    imageLimit: 4,
    videoLimit: 0,
    highlights: ["50 products", "4 images per product", "Public shop link"],
  },
  basic: {
    id: "basic",
    name: "Plan 1",
    price: 500,
    productLimit: 100,
    imageLimit: 8,
    videoLimit: 0,
    highlights: ["100 products", "8 images per product", "Public product search"],
  },
  growth: {
    id: "growth",
    name: "Plan 2",
    price: 1000,
    productLimit: 200,
    imageLimit: 8,
    videoLimit: 0,
    highlights: ["200 products", "8 images per product", "Public product search"],
  },
  pro: {
    id: "pro",
    name: "Plan 3",
    price: 5000,
    productLimit: 500,
    imageLimit: 8,
    videoLimit: 0,
    highlights: ["500 products", "8 images per product", "Public product search"],
  },
};

export const PLAN_LIST: Plan[] = Object.values(PLANS);

/**
 * Default per-day boost pricing — a fallback while the live (admin-editable)
 * pricing loads from `useGetBoostPricingQuery`.
 */
export const DEFAULT_BOOST_PRICING: BoostPricing = { pricePerDay: 100, minDays: 1, maxDays: 30 };

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
/** Contact email shown on legal / support pages. */
export const SITE_EMAIL = "info@bazaarnagar.com";

/**
 * Bazaarnagar's own social pages, shown as icons in the footer. Leave a value
 * empty to hide that icon. Handles or full links both work (see lib/socials).
 */
export const SITE_SOCIALS: Partial<Record<import("./socials").SocialPlatform, string>> = {
  facebook: "",
  instagram: "",
  youtube: "",
  tiktok: "",
  linkedin: "",
  twitter: "",
};
/** Support phone / WhatsApp, in international digits (no +) and display form. */
export const SITE_PHONE = "923241201757";
export const SITE_PHONE_DISPLAY = "+92 324 1201757";
/**
 * Master switch for all ads (banner ads + Google AdSense). When false, no ad
 * slots render on shop pages and the AdSense script isn't loaded, whatever
 * the admin Ad Settings say.
 */
export const ADS_ENABLED = false;
/**
 * Whether new sellers must pass CNIC (KYC) verification before using the
 * dashboard. Keep in sync with the backend's KYC_REQUIRED env variable.
 */
export const KYC_REQUIRED = false;
/** Last revision date for the legal pages. */
export const LEGAL_UPDATED = "16 July 2026";
