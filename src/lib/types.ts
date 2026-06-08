/**
 * Shared domain types for Bazaarnagar (Prototype 1).
 * These mirror the entities described in the SRS and are used by both the
 * mock data layer and the (future) Express + MongoDB backend responses.
 */

export type PlanId = "starter" | "basic" | "growth" | "pro";

export interface Plan {
  id: PlanId;
  name: string;
  price: number; // PKR / month
  productLimit: number;
  imageLimit: number; // images per product
  videoLimit: number; // videos per product (0 = not allowed)
  highlights: string[];
}

export type SubscriptionStatus =
  | "trial"
  | "active"
  | "expired"
  | "suspended"
  | "cancelled";

export type SellerStatus = "active" | "inactive" | "suspended";

export interface Seller {
  id: string;
  name: string;
  phone: string;
  email: string;
  status: SellerStatus;
  planId: PlanId;
  subscriptionStatus: SubscriptionStatus;
  storeId: string | null;
  createdAt: string; // ISO date
}

export type StoreStatus = "active" | "inactive" | "pending";

export interface Store {
  id: string;
  sellerId: string;
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
  showLocation: boolean;
  showInSearch: boolean;
  socials?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  };
  deliveryInfo?: string;
  paymentInfo?: string;
  status: StoreStatus;
  views: number;
  whatsappClicks: number;
}

export type StockStatus = "in_stock" | "out_of_stock";
export type ProductStatus = "active" | "inactive";
export type ProductCondition = "new" | "used";

export type ModerationStatus =
  | "pending"
  | "approved"
  | "flagged"
  | "rejected"
  | "needs_edit";

export interface Product {
  id: string;
  storeId: string;
  name: string;
  category: string;
  price: number;
  discountPrice?: number;
  images: string[];
  videoUrl?: string;
  description?: string;
  tags: string[];
  stockStatus: StockStatus;
  status: ProductStatus;
  negotiable: boolean;
  condition?: ProductCondition;
  deliveryAvailable?: boolean;
  moderationStatus: ModerationStatus;
  views: number;
  whatsappClicks: number;
  createdAt: string;
}

/** A product joined with its store — handy for public search & detail views. */
export interface ProductWithStore extends Product {
  store: Store;
}

export interface DashboardMetrics {
  productsUsed: number;
  productLimit: number;
  totalProducts: number;
  activeProducts: number;
  outOfStockProducts: number;
  shopViews: number;
  productViews: number;
  whatsappClicks: number;
}
