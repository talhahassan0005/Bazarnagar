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
  highlights?: string[];
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
  subscriptionStartedAt?: string;
  subscriptionEndsAt?: string;
  autoRenew?: boolean;
  storeId: string | null;
  createdAt: string;
}

export type StoreStatus = "active" | "inactive" | "pending";

/** Accent themes a seller can pick for their landing page. */
export type StoreTheme = "brand" | "emerald" | "rose" | "amber" | "dark";

/**
 * Per-store landing page configuration (seller-customizable).
 * Lives on the public store at `/store/[slug]`; the catalog moves to
 * `/store/[slug]/products`. Every field is optional except the toggles — a
 * store with no saved config falls back to sensible defaults derived from its
 * profile via `resolveLanding()`.
 */
export interface StoreLanding {
  /** When false, `/store/[slug]` shows the catalog directly (no landing). */
  enabled: boolean;
  theme: StoreTheme;
  headline?: string; // hero title (fallback: store.name)
  tagline?: string; // hero subtext (fallback: store.description)
  heroImageUrl?: string; // hero background (fallback: store.coverUrl)
  primaryCtaLabel?: string; // fallback: "Browse products"
  showFeatured: boolean;
  featuredProductIds: string[]; // curated products shown on the landing
  showAbout: boolean;
  aboutTitle?: string;
  aboutText?: string;
  showContact: boolean; // WhatsApp / location / socials block
}

/** Seller's payout details — where the seller receives their earnings. */
export type PayoutMethod = "easypaisa" | "jazzcash" | "bank";

export interface StorePayout {
  method: PayoutMethod;
  accountTitle: string; // account holder's name
  accountNumber: string; // mobile number (wallets) or account/IBAN (bank)
  bankName?: string; // only for bank transfers
  /** Set once valid details are saved — the account is "connected" (ISO date). */
  connectedAt?: string;
}

export interface Store {
  id: string;
  sellerId: string;
  /** Seller's current plan — present on public store responses. */
  planId?: PlanId;
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
  /** Shop coordinates — captured via "use my current location". */
  lat?: number;
  lng?: number;
  showLocation: boolean;
  showInSearch: boolean;
  /** Seller toggle — is the shop currently open for orders? */
  isOpen?: boolean;
  socials?: {
    instagram?: string;
    facebook?: string;
    tiktok?: string;
  };
  deliveryInfo?: string;
  paymentInfo?: string;
  /** Seller-customizable landing page config (optional). */
  landing?: StoreLanding;
  /** Seller's payout details (optional). */
  payout?: StorePayout;
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
  /** Optional per-product location (falls back to the store's location). */
  lat?: number;
  lng?: number;
  moderationStatus: ModerationStatus;
  /** Paid "boost" — product is featured while this date is in the future. */
  boostedUntil?: string;
  views: number;
  whatsappClicks: number;
  createdAt: string;
}

export interface ProductRating {
  average: number;
  count: number;
}

/** A product joined with its store — handy for public search & detail views. */
export interface ProductWithStore extends Product {
  store: Store;
  /** Present on the public product-detail response. */
  rating?: ProductRating;
}

/* --------------------------------- Reviews -------------------------------- */

export type ReviewStatus = "pending" | "approved" | "rejected";

export interface Review {
  id: string;
  productId: string;
  storeId: string;
  customerName: string;
  rating: number; // 1–5
  comment?: string;
  status: ReviewStatus;
  createdAt: string;
}

/** Review joined with its product name — for the admin moderation queue. */
export interface AdminReview extends Review {
  productName: string;
}

export interface ProductReviews extends ProductRating {
  reviews: Review[];
}

/* -------------------------------- Payments -------------------------------- */

export interface Payment {
  id: string;
  sellerId: string;
  planId: PlanId;
  amount: number;
  method: string;
  paidAt: string;
  notes?: string;
}

/* ---------------------------------- Cart ---------------------------------- */

/** A line in the browser-side cart (no customer accounts). */
export interface CartItem {
  productId: string;
  name: string;
  price: number; // effective (discounted) unit price
  image?: string;
  quantity: number;
  // Store context — the cart can hold items from multiple shops.
  storeId: string;
  storeName: string;
  storeSlug: string;
  whatsapp: string;
}

/* --------------------------------- Orders --------------------------------- */

export type OrderStatus =
  | "pending"
  | "confirmed"
  | "shipped"
  | "delivered"
  | "cancelled";

export type PaymentMethod = "cod" | "card" | "online";
export type PaymentStatus = "unpaid" | "paid";

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface Order {
  id: string;
  storeId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  note?: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  createdAt: string;
}

/** Payload sent when a guest places an order. */
export interface CreateOrderInput {
  storeId: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  customerCity: string;
  note?: string;
  items: { productId: string; quantity: number }[];
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
