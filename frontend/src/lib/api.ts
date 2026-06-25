import type {
  AdminReview,
  CreateOrderInput,
  DashboardMetrics,
  ModerationStatus,
  Order,
  OrderStatus,
  Payment,
  PlanId,
  Product,
  ProductReviews,
  ProductWithStore,
  Review,
  ReviewStatus,
  Seller,
  SellerStatus,
  Store,
  StoreLanding,
  StoreStatus,
  StoreStripe,
  SubscriptionStatus,
} from "./types";

/**
 * HTTP API client. Talks to the Express + MongoDB backend (see `backend/`).
 * Every data access in the UI goes through this module; component code and the
 * RTK Query slice call these methods and never `fetch` directly.
 *
 * Set `NEXT_PUBLIC_API_BASE` in `frontend/.env.local` to point at the backend
 * (defaults to the local dev server).
 */
export const API_BASE =
  process.env.NEXT_PUBLIC_API_BASE ?? "http://localhost:5000/api";

const TOKEN_KEY = "bn_token";

/* ------------------------------ Auth token -------------------------------- */

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  return window.localStorage.getItem(TOKEN_KEY);
}
export function setToken(token: string): void {
  if (typeof window !== "undefined") window.localStorage.setItem(TOKEN_KEY, token);
}
export function clearToken(): void {
  if (typeof window !== "undefined") window.localStorage.removeItem(TOKEN_KEY);
}

/* ------------------------------ Core request ------------------------------ */

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  /** Attach the bearer token (default: true when a token exists). */
  auth?: boolean;
}

async function request<T>(path: string, opts: RequestOptions = {}): Promise<T> {
  const { method = "GET", body, auth = true } = opts;
  const headers: Record<string, string> = {};
  if (body !== undefined) headers["Content-Type"] = "application/json";
  const token = auth ? getToken() : null;
  if (token) headers["Authorization"] = `Bearer ${token}`;

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    // Network-level failure (server down, CORS, offline) — fetch rejects.
    throw new Error(
      `Cannot reach the server at ${API_BASE}. Make sure the backend is running (cd backend && npm run dev).`
    );
  }

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data?.message ?? data?.error ?? message;
    } catch {
      /* non-JSON error body */
    }
    throw new Error(message);
  }

  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

const qs = (params: Record<string, string | boolean | undefined>) => {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "" && v !== false) sp.set(k, String(v));
  }
  const s = sp.toString();
  return s ? `?${s}` : "";
};

/* -------------------------------- Auth API -------------------------------- */

export interface SellerAuthResponse {
  token: string;
  seller: Seller;
}
export interface AdminAuthResponse {
  token: string;
  admin: { id: string; name: string; email: string };
}

export const api = {
  /* ----------------------------- Auth ----------------------------- */
  async signupSeller(input: {
    name: string;
    phone: string;
    email: string;
    password: string;
  }): Promise<SellerAuthResponse> {
    return request("/auth/signup", { method: "POST", body: input, auth: false });
  },

  async loginSeller(input: {
    email: string;
    password: string;
  }): Promise<SellerAuthResponse> {
    return request("/auth/login", { method: "POST", body: input, auth: false });
  },

  async loginAdmin(input: {
    email: string;
    password: string;
  }): Promise<AdminAuthResponse> {
    return request("/admin/login", { method: "POST", body: input, auth: false });
  },

  /** Restore the current session from a stored token. */
  async getMe(): Promise<
    | { role: "seller"; seller: Seller; store: Store | null }
    | { role: "admin"; admin: { id: string; name: string; email: string } }
  > {
    return request("/auth/me");
  },

  /* --------------------------- Public / customer -------------------------- */
  async getStores(params?: { q?: string; city?: string }): Promise<Store[]> {
    return request(`/public/stores${qs(params ?? {})}`, { auth: false });
  },

  async getStoreBySlug(slug: string): Promise<Store | null> {
    return request(`/public/stores/${slug}`, { auth: false });
  },

  async getStoreProducts(
    storeId: string,
    opts?: { publicOnly?: boolean }
  ): Promise<Product[]> {
    return request(
      `/public/stores/${storeId}/products${qs({ publicOnly: opts?.publicOnly })}`,
      { auth: false }
    );
  },

  async getProduct(productId: string): Promise<ProductWithStore | null> {
    return request(`/public/products/${productId}`, { auth: false });
  },

  async searchProducts(params: {
    q?: string;
    category?: string;
    city?: string;
    area?: string;
  }): Promise<ProductWithStore[]> {
    return request(`/public/search${qs(params)}`, { auth: false });
  },

  async trackWhatsappClick(productId: string): Promise<{ ok: boolean }> {
    return request(`/public/products/${productId}/whatsapp-click`, {
      method: "POST",
      auth: false,
    });
  },

  /* ------------------------------- Reviews ------------------------------- */
  async getProductReviews(productId: string): Promise<ProductReviews> {
    return request(`/public/products/${productId}/reviews`, { auth: false });
  },

  async createReview(
    productId: string,
    input: { customerName: string; rating: number; comment?: string }
  ): Promise<Review> {
    return request(`/public/products/${productId}/reviews`, {
      method: "POST",
      body: input,
      auth: false,
    });
  },

  /* -------------------------------- Orders ------------------------------- */
  async createOrder(input: CreateOrderInput): Promise<Order> {
    return request(`/public/orders`, { method: "POST", body: input, auth: false });
  },

  /** Create a Stripe Checkout Session for a card order — returns the pay URL. */
  async createCheckoutSession(
    input: CreateOrderInput
  ): Promise<{ url: string; orderId: string }> {
    return request(`/public/checkout`, { method: "POST", body: input, auth: false });
  },

  async getSellerOrders(): Promise<Order[]> {
    return request(`/seller/orders`);
  },

  async updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
    return request(`/seller/orders/${id}/status`, {
      method: "PATCH",
      body: { status },
    });
  },

  /* ------------------------------- Seller -------------------------------- */
  async getSeller(): Promise<Seller> {
    return request(`/seller/me`);
  },

  async getMyStore(): Promise<Store | null> {
    return request(`/seller/store`);
  },

  async getMyProducts(): Promise<Product[]> {
    return request(`/seller/products`);
  },

  async getDashboardMetrics(): Promise<DashboardMetrics> {
    return request(`/seller/dashboard`);
  },

  async updateStoreLanding(landing: StoreLanding): Promise<Store | null> {
    return request(`/seller/store/landing`, { method: "PATCH", body: landing });
  },

  async updatePayment(stripe: StoreStripe): Promise<Store | null> {
    return request(`/seller/store/payment`, { method: "PATCH", body: stripe });
  },

  /** Start (or resume) Stripe Connect onboarding — returns a redirect URL. */
  async stripeOnboard(): Promise<{ url: string }> {
    return request(`/seller/stripe/onboard`, { method: "POST" });
  },

  /** Refresh the connected Stripe account's status, returning the updated store. */
  async stripeStatus(): Promise<Store | null> {
    return request(`/seller/stripe/status`);
  },

  async upsertStore(values: Partial<Store>): Promise<Store> {
    return request(`/seller/store`, { method: "PUT", body: values });
  },

  async createProduct(values: Partial<Product>): Promise<Product> {
    return request(`/seller/products`, { method: "POST", body: values });
  },

  async updateProduct(id: string, values: Partial<Product>): Promise<Product> {
    return request(`/seller/products/${id}`, { method: "PUT", body: values });
  },

  async deleteProduct(id: string): Promise<{ ok: boolean }> {
    return request(`/seller/products/${id}`, { method: "DELETE" });
  },

  async changePlan(planId: PlanId): Promise<Seller> {
    return request(`/seller/plan`, { method: "PATCH", body: { planId } });
  },

  /** Upload one image (seller-authenticated). Returns its public URL. */
  async uploadImage(file: File): Promise<{ url: string }> {
    const form = new FormData();
    form.append("image", file);
    const token = getToken();
    let res: Response;
    try {
      res = await fetch(`${API_BASE}/upload`, {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: form,
      });
    } catch {
      throw new Error(
        `Cannot reach the server at ${API_BASE}. Make sure the backend is running.`
      );
    }
    if (!res.ok) {
      let message = `Upload failed (${res.status})`;
      try {
        const d = await res.json();
        message = d?.message ?? message;
      } catch {
        /* non-JSON */
      }
      throw new Error(message);
    }
    return res.json();
  },

  /* -------------------------------- Admin -------------------------------- */
  async getAllSellers(): Promise<Seller[]> {
    return request(`/admin/sellers`);
  },

  async getAllStores(): Promise<Store[]> {
    return request(`/admin/stores`);
  },

  async getAllProducts(): Promise<ProductWithStore[]> {
    return request(`/admin/products`);
  },

  async moderateProduct(
    id: string,
    moderationStatus: ModerationStatus,
    reason?: string
  ): Promise<Product> {
    return request(`/admin/products/${id}/moderation`, {
      method: "PATCH",
      body: { moderationStatus, reason },
    });
  },

  async updateSeller(
    id: string,
    patch: {
      status?: SellerStatus;
      planId?: Seller["planId"];
      subscriptionStatus?: SubscriptionStatus;
    }
  ): Promise<Seller> {
    return request(`/admin/sellers/${id}`, { method: "PATCH", body: patch });
  },

  async updateStore(id: string, status: StoreStatus): Promise<Store> {
    return request(`/admin/stores/${id}`, { method: "PATCH", body: { status } });
  },

  async recordPayment(
    sellerId: string,
    body: {
      planId: PlanId;
      amount: number;
      method: string;
      paidAt?: string;
      notes?: string;
      applyToSeller?: boolean;
      subscriptionStatus?: SubscriptionStatus;
    }
  ): Promise<{ payment: Payment; seller: Seller }> {
    return request(`/admin/sellers/${sellerId}/payments`, { method: "POST", body });
  },

  async getSellerPayments(sellerId: string): Promise<Payment[]> {
    return request(`/admin/sellers/${sellerId}/payments`);
  },

  async getAllReviews(): Promise<AdminReview[]> {
    return request(`/admin/reviews`);
  },

  async moderateReview(id: string, status: ReviewStatus): Promise<Review> {
    return request(`/admin/reviews/${id}`, { method: "PATCH", body: { status } });
  },
};
