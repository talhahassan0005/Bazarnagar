import { PLANS } from "./constants";
import { CURRENT_SELLER_ID, PRODUCTS, SELLERS, STORES } from "./mockData";
import type {
  DashboardMetrics,
  Product,
  ProductWithStore,
  Seller,
  Store,
} from "./types";

/**
 * API client abstraction.
 *
 * Every data access in the UI goes through this module. Right now it resolves
 * against the in-memory mock data, simulating network latency. When the Express
 * backend is ready we only change the bodies of these functions (to `fetch`
 * `${API_BASE}/...`) — component code does not change.
 */

export const API_BASE = process.env.NEXT_PUBLIC_API_BASE ?? "/api";

const delay = <T>(data: T, ms = 250): Promise<T> =>
  new Promise((resolve) => setTimeout(() => resolve(data), ms));

function withStore(product: Product): ProductWithStore {
  const store = STORES.find((s) => s.id === product.storeId)!;
  return { ...product, store };
}

/** Products that customers are allowed to see publicly. */
function isPubliclyVisible(p: Product): boolean {
  return p.status === "active" && p.moderationStatus === "approved";
}

/* ----------------------------- Public / customer ---------------------------- */

export const api = {
  async getStoreBySlug(slug: string): Promise<Store | null> {
    return delay(STORES.find((s) => s.slug === slug) ?? null);
  },

  async getStoreProducts(storeId: string, opts?: { publicOnly?: boolean }) {
    let list = PRODUCTS.filter((p) => p.storeId === storeId);
    if (opts?.publicOnly) list = list.filter(isPubliclyVisible);
    return delay(list);
  },

  async getProduct(productId: string): Promise<ProductWithStore | null> {
    const product = PRODUCTS.find((p) => p.id === productId);
    return delay(product ? withStore(product) : null);
  },

  async searchProducts(params: {
    q?: string;
    category?: string;
    city?: string;
    area?: string;
  }): Promise<ProductWithStore[]> {
    const q = params.q?.trim().toLowerCase();
    const results = PRODUCTS.filter(isPubliclyVisible)
      .map(withStore)
      .filter((p) => p.store.showInSearch)
      .filter((p) => {
        if (params.category && p.category !== params.category) return false;
        if (params.city && p.store.city !== params.city) return false;
        if (params.area && p.store.area !== params.area) return false;
        if (q) {
          const haystack = [
            p.name,
            p.description ?? "",
            p.category,
            p.tags.join(" "),
            p.store.name,
            p.store.city,
            p.store.area ?? "",
          ]
            .join(" ")
            .toLowerCase();
          if (!haystack.includes(q)) return false;
        }
        return true;
      });
    return delay(results);
  },

  /* ------------------------------- Seller side ------------------------------ */

  async getSeller(sellerId: string = CURRENT_SELLER_ID): Promise<Seller> {
    return delay(SELLERS.find((s) => s.id === sellerId)!);
  },

  async getMyStore(sellerId: string = CURRENT_SELLER_ID): Promise<Store | null> {
    const seller = SELLERS.find((s) => s.id === sellerId)!;
    return delay(STORES.find((s) => s.id === seller.storeId) ?? null);
  },

  async getMyProducts(sellerId: string = CURRENT_SELLER_ID): Promise<Product[]> {
    const seller = SELLERS.find((s) => s.id === sellerId)!;
    return delay(PRODUCTS.filter((p) => p.storeId === seller.storeId));
  },

  async getDashboardMetrics(
    sellerId: string = CURRENT_SELLER_ID
  ): Promise<DashboardMetrics> {
    const seller = SELLERS.find((s) => s.id === sellerId)!;
    const store = STORES.find((s) => s.id === seller.storeId);
    const products = PRODUCTS.filter((p) => p.storeId === seller.storeId);
    const plan = PLANS[seller.planId];
    return delay({
      productsUsed: products.length,
      productLimit: plan.productLimit,
      totalProducts: products.length,
      activeProducts: products.filter((p) => p.status === "active").length,
      outOfStockProducts: products.filter((p) => p.stockStatus === "out_of_stock")
        .length,
      shopViews: store?.views ?? 0,
      productViews: products.reduce((sum, p) => sum + p.views, 0),
      whatsappClicks: store?.whatsappClicks ?? 0,
    });
  },

  /* -------------------------------- Admin side ------------------------------ */

  async getAllSellers(): Promise<Seller[]> {
    return delay(SELLERS);
  },

  async getAllStores(): Promise<Store[]> {
    return delay(STORES);
  },

  async getAllProducts(): Promise<ProductWithStore[]> {
    return delay(PRODUCTS.map(withStore));
  },
};
