import type { SocialPlatform } from "./socials";

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
  enabled?: boolean;
  /** Separate US-dollar price / month for overseas sellers (0 = not offered). Admin-set. */
  priceUsd?: number;
  /** Pricing page card text (admin-set). */
  tagline?: string;
  description?: string;
  features?: string[];
  /** The "Recommended" card on the pricing page. */
  highlighted?: boolean;
}

/** Editable plan fields sent by the admin Plan Settings page. */
/** Admin: what happens when a paid plan expires and isn't renewed. */
export interface SubscriptionSettings {
  /** true: warn (3 emails) during the grace period, then move to Free. false: keep the paid plan's features. */
  downgradeAfterExpiry: boolean;
  graceDays: number;
}

export interface PlanConfigInput {
  planId: PlanId;
  price: number;
  productLimit: number;
  imageLimit: number;
  videoLimit: number;
  enabled?: boolean;
  priceUsd?: number;
  name?: string;
  tagline?: string;
  description?: string;
  features?: string[];
  highlighted?: boolean;
}

/** Featured-product "boost" pricing — any seller pays per day; admin-editable. */
export interface BoostPricing {
  pricePerDay: number; // PKR
  minDays: number;
  maxDays: number;
}

export type SubscriptionStatus =
  | "trial"
  | "active"
  | "expired"
  | "suspended"
  | "cancelled";

export type SellerStatus = "pending" | "active" | "inactive" | "suspended";

export interface Seller {
  id: string;
  name: string;
  phone: string;
  email: string;
  /** Missing on accounts created before signup asked for it. */
  country?: string;
  status: SellerStatus;
  planId: PlanId;
  subscriptionStatus: SubscriptionStatus;
  subscriptionStartedAt?: string;
  subscriptionEndsAt?: string;
  autoRenew?: boolean;
  storeId: string | null;
  /** KYC — submitted while status is "pending", reviewed by an admin. */
  kycCnicFront?: string;
  kycCnicBack?: string;
  kycSubmittedAt?: string;
  kycRejectionReason?: string;
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
  /** Handles or links, keyed by platform (see lib/socials). */
  socials?: Partial<Record<SocialPlatform, string>>;
  deliveryInfo?: string;
  /** Shop doesn't deliver: no online orders — customers contact on WhatsApp. */
  noDelivery?: boolean;
  paymentInfo?: string;
  /** Seller-customizable landing page config (optional). */
  landing?: StoreLanding;
  /** Seller's payout details (optional). */
  payout?: StorePayout;
  status: StoreStatus;
  /** Admin review queue (set when the store is created or edited). */
  review?: {
    status: "pending" | "reviewed";
    reason: "created" | "updated";
    changes: string[];
    requestedAt: string;
    reviewedAt?: string;
  };
  /** Seller/admin only — public endpoints omit views and whatsappClicks. */
  views: number;
  whatsappClicks: number;
  addToCartClicks: number;
  buyNowClicks: number;
}

export type StockStatus = "in_stock" | "out_of_stock";
export type ProductStatus = "active" | "inactive";
export type ProductCondition = "new" | "used";
export type DeliveryOption = "available" | "not_available" | "negotiable";

export type ModerationStatus =
  | "pending"
  | "approved"
  | "flagged"
  | "rejected"
  | "needs_edit";

export interface Product {
  id: string;
  /** Over the plan's product limit (e.g. after moving to Free): hidden from customers, still visible to the seller. */
  hiddenOverPlanLimit?: boolean;
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
  deliveryOption: DeliveryOption;
  /** Flat delivery fee (PKR). Ignored when deliveryOption is "negotiable" or "not_available". */
  deliveryFee?: number;
  /** Optional per-product location (falls back to the store's location). */
  lat?: number;
  lng?: number;
  moderationStatus: ModerationStatus;
  /** Paid "boost" — product is featured while this date is in the future. */
  boostedUntil?: string;
  /** Seller/admin only — public endpoints omit views and whatsappClicks. */
  views: number;
  whatsappClicks: number;
  addToCartClicks: number;
  buyNowClicks: number;
  createdAt: string;
}

export interface ProductRating {
  average: number;
  count: number;
}

/** A product joined with its store — handy for public search & detail views. */
export interface ProductWithStore extends Product {
  store: Store;
  /** Admin listing only: logged keyword searches that returned this product. */
  searchCount?: number;
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
  /** A plan id, or "boost" for a verified product-boost payment. */
  planId: PlanId | "boost";
  amount: number;
  method: string;
  paidAt: string;
  notes?: string;
}

/* ---------------------------- Manual Payments ------------------------------ */

export type PaymentRequestStatus = "pending" | "approved" | "rejected";
export type PaymentRequestMethod = "bank" | "jazzcash" | "easypaisa";

/** Seller-submitted manual subscription payment awaiting admin verification. */
export interface PaymentRequest {
  id: string;
  sellerId: string;
  /** Present on admin listings (joined server-side). */
  sellerName?: string;
  sellerEmail?: string;
  /** "plan" waits for admin approval; "boost" is live as soon as it's paid. */
  purpose: "plan" | "boost";
  /** Plan payments only. */
  planId?: PlanId;
  /** Boost payments only. */
  productId?: string;
  productName?: string;
  days?: number;
  amount: number;
  method: PaymentRequestMethod;
  reference: string;
  proofUrl?: string;
  status: PaymentRequestStatus;
  reviewNote?: string;
  createdAt: string;
}

/** Admin-configured bank/JazzCash/EasyPaisa details shown to sellers. */
export interface ManualPaymentSettings {
  bankAccountTitle?: string;
  bankAccountNumber?: string;
  bankName?: string;
  jazzcashNumber?: string;
  easypaisaNumber?: string;
  instructions?: string;
}

/* --------------------------------- Customer -------------------------------- */

/** A buyer account — separate from Seller/Admin. */
export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string;
  /** Missing on accounts created before signup asked for it. */
  country?: string;
  createdAt: string;
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
  // Delivery — shown as an estimate in the cart; the server computes the
  // authoritative total (once per distinct product, not per unit).
  deliveryOption?: DeliveryOption;
  deliveryFee?: number;
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
  /** Present on order-history lookups (joined server-side). */
  storeName?: string;
  storeSlug?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  customerCity: string;
  note?: string;
  items: OrderItem[];
  subtotal: number;
  deliveryFee: number;
  total: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  /** Set when a logged-in buyer placed the order (otherwise a guest). */
  customerId?: string;
  /** When the order reached each status; missing on older orders. */
  statusHistory?: { status: OrderStatus; at: string }[];
  createdAt: string;
}

/** Payload sent when a guest places an order. */
export interface CreateOrderInput {
  storeId: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  customerAddress: string;
  customerCity: string;
  note?: string;
  items: { productId: string; quantity: number }[];
}

/* --------------------------------- Banners --------------------------------- */

export type BannerPlacement = "top" | "bottom" | "sidebar";

/** Admin-managed banner ad shown on free (starter) plan shop pages. */
export interface Banner {
  id: string;
  title?: string;
  imageUrl: string;
  linkUrl?: string;
  /** Target a specific store category (case-insensitive). Empty = shown on every store. */
  category?: string;
  /** Which slot this banner shows in. Empty = eligible for every slot. */
  placement?: BannerPlacement;
  active: boolean;
  order: number;
  createdAt: string;
}

/* ------------------------------- Ad settings -------------------------------- */

export type AdPlacementSource = "manual" | "adsense" | "off";

export interface AdPlacementConfig {
  source: AdPlacementSource;
  /** Google AdSense ad-unit slot id — only meaningful when source is "adsense". */
  adsenseSlotId?: string;
}

/** Admin-chosen ad source (manual banner vs Google AdSense) per storefront slot. */
export interface AdSettings {
  adsenseEnabled: boolean;
  adsensePublisherId?: string;
  placements: {
    top: AdPlacementConfig;
    bottom: AdPlacementConfig;
    sidebar: AdPlacementConfig;
  };
}

/* ---------------------------------- Chat ----------------------------------- */

export type MessageSender = "customer" | "seller";

export interface ChatMessage {
  id: string;
  conversationId: string;
  senderRole: MessageSender;
  text: string;
  createdAt: string;
}

export interface Conversation {
  id: string;
  storeId: string;
  customerId: string;
  productId?: string;
  productName?: string;
  lastMessageText?: string;
  lastMessageAt?: string;
  createdAt: string;
  /** Present on customer-side listings (joined server-side). */
  store?: Pick<Store, "id" | "name" | "slug" | "logoUrl">;
  /** Present on seller-side listings (joined server-side). */
  customer?: Pick<Customer, "id" | "name" | "phone">;
}

/** Social link taps of one store, per platform and per day (Pakistan dates, newest first). */
export interface SocialClickReport {
  total: number;
  totals: Partial<Record<SocialPlatform, number>>;
  days: { date: string; total: number; counts: Partial<Record<SocialPlatform, number>> }[];
}

export type SocialClickPeriod = "7" | "30" | "90" | "all";

/** Admin: a store's social link clicks in the chosen period. */
export interface AdminSocialClickRow {
  id: string;
  storeId: string;
  storeName: string;
  storeSlug: string;
  sellerName: string;
  sellerEmail: string;
  platforms: SocialPlatform[];
  total: number;
  totals: Partial<Record<SocialPlatform, number>>;
  lastClickAt?: string;
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
  addToCartClicks: number;
  buyNowClicks: number;
}

/* ── Admin activity log & data summary ───────────────────────────────────── */

export type ActivityType = "store.created" | "product.created" | "buyer.registered";

export interface ActivityLog {
  id: string;
  type: ActivityType;
  sellerId?: string;
  customerId?: string;
  storeId?: string;
  productId?: string;
  /** Details as they were when the event happened. */
  snapshot: {
    sellerName?: string;
    sellerEmail?: string;
    buyerName?: string;
    buyerEmail?: string;
    storeName?: string;
    storeSlug?: string;
    city?: string;
    category?: string;
    productName?: string;
    price?: number;
  };
  createdAt: string;
}

/** Filters shared by the activity list and its CSV export. */
export interface ActivityLogFilters {
  type?: ActivityType;
  /** Search across seller, store, product, city and category. */
  q?: string;
  /** ISO datetimes — inclusive range. */
  from?: string;
  to?: string;
}

export interface ActivityLogPage {
  items: ActivityLog[];
  total: number;
  page: number;
  pages: number;
}

export interface CountRow {
  key: string;
  count: number;
}

export interface DataSummary {
  generatedAt: string;
  stores: {
    total: number;
    newThisWeek: number;
    newThisMonth: number;
    open: number;
    withoutProducts: number;
    byStatus: CountRow[];
    byCity: CountRow[];
    byCategory: CountRow[];
  };
  products: {
    total: number;
    newThisWeek: number;
    newThisMonth: number;
    boosted: number;
    byStatus: CountRow[];
    byStock: CountRow[];
    byModeration: CountRow[];
    byCategory: CountRow[];
  };
}

/* ── Admin storage usage ─────────────────────────────────────────────────── */

export interface StorageUsageRow {
  storeId: string;
  storeName: string;
  storeSlug: string;
  storeStatus: StoreStatus;
  sellerName: string;
  sellerEmail: string;
  planId: PlanId;
  files: number;
  bytes: number;
  lastUpload: string | null;
}

export interface StorageUsage {
  scope: "paid" | "all";
  totals: { stores: number; files: number; bytes: number };
  rows: StorageUsageRow[];
}

/* ── Admin search insights ───────────────────────────────────────────────── */

export interface SearchInsights {
  days: "7" | "30" | "all";
  totals: { searches: number; uniqueTerms: number; zeroResultSearches: number };
  topTerms: { query: string; count: number; avgResults: number; lastSearched: string }[];
  zeroResultTerms: { query: string; count: number; lastSearched: string }[];
  topProducts: { productId: string; name: string; storeName: string; storeSlug: string; searches: number }[];
}

/** One logged keyword search (admin search log). */
export interface SearchLogEntry {
  id: string;
  query: string;
  category?: string;
  city?: string;
  resultCount: number;
  createdAt: string;
}

export interface SearchLogPage {
  items: SearchLogEntry[];
  total: number;
  page: number;
  pages: number;
}

/** Admin buyers list: an account plus its order activity. */
export interface AdminBuyer {
  id: string;
  name: string;
  email: string;
  phone: string;
  country?: string;
  createdAt: string;
  lastLoginAt?: string;
  orders: number;
  totalSpent: number;
  lastOrderAt: string | null;
}

/** Admin orders list filters (dates are ISO bounds). */
export interface AdminOrderFilters {
  status?: OrderStatus;
  q?: string;
  from?: string;
  to?: string;
}

export interface AdminOrdersPage {
  items: (Order & { storeName: string; storeSlug: string })[];
  total: number;
  page: number;
  pages: number;
  summary: { byStatus: Record<OrderStatus, number>; value: number };
}

/** A store in the admin review queue, with its seller. */
export interface StoreReviewItem extends Store {
  sellerName: string;
  sellerEmail: string;
  sellerPhone: string;
}
