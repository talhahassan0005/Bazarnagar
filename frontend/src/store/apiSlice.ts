import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { type UnknownAction, type ThunkDispatch, type TypedStartListening } from "@reduxjs/toolkit";
import { API_BASE, getToken, setToken, clearToken } from "@/lib/api";
import { setSellerSession, setAdminSession, logout as logoutAction } from "@/store/authSlice";
import type {
  AdminReview,
  Banner,
  CreateOrderInput,
  DashboardMetrics,
  ModerationStatus,
  Order,
  OrderStatus,
  Payment,
  Plan,
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
  StorePayout,
  SubscriptionStatus,
} from "@/lib/types";

/* ── Types ──────────────────────────────────────────────────────────────── */

export interface SellerAuthResponse { token: string; seller: Seller }
export interface AdminAuthResponse { token: string; admin: { id: string; name: string; email: string } }

type MeResponse =
  | { role: "seller"; seller: Seller; store: Store | null }
  | { role: "admin"; admin: { id: string; name: string; email: string } };

/* ── Base query with auth header ────────────────────────────────────────── */

const baseQuery = fetchBaseQuery({
  baseUrl: API_BASE,
  prepareHeaders: (headers) => {
    const token = getToken();
    if (token) headers.set("Authorization", `Bearer ${token}`);
    return headers;
  },
});

/* ── API slice ──────────────────────────────────────────────────────────── */

export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery,
  tagTypes: ["Product", "Store", "Seller", "Order", "Review", "Payment", "Banner"],
  endpoints: (builder) => ({

    // ── Auth ──────────────────────────────────────────────────────────────
    loginSeller: builder.mutation<SellerAuthResponse, { email: string; password: string }>({
      query: (body) => ({ url: "/auth/login", method: "POST", body }),
    }),
    signupSeller: builder.mutation<SellerAuthResponse, { name: string; phone: string; email: string; password: string }>({
      query: (body) => ({ url: "/auth/signup", method: "POST", body }),
    }),
    loginAdmin: builder.mutation<AdminAuthResponse, { email: string; password: string }>({
      query: (body) => ({ url: "/admin/login", method: "POST", body }),
    }),
    getMe: builder.query<MeResponse, void>({
      query: () => "/auth/me",
    }),

    // ── Public / customer ─────────────────────────────────────────────────
    getPublicStores: builder.query<Store[], { q?: string; city?: string }>({
      query: (params) => ({ url: "/public/stores", params }),
      providesTags: ["Store"],
    }),
    getStoreBySlug: builder.query<Store | null, string>({
      query: (slug) => `/public/stores/${slug}`,
      providesTags: ["Store"],
    }),
    getStoreProducts: builder.query<Product[], { storeId: string; publicOnly?: boolean }>({
      query: ({ storeId, publicOnly }) => ({
        url: `/public/stores/${storeId}/products`,
        params: publicOnly ? { publicOnly: "true" } : {},
      }),
      providesTags: ["Product"],
    }),
    getProduct: builder.query<ProductWithStore | null, string>({
      query: (id) => `/public/products/${id}`,
      providesTags: ["Product"],
    }),
    searchProducts: builder.query<ProductWithStore[], { q?: string; category?: string; city?: string; area?: string }>({
      query: (params) => ({ url: "/public/search", params }),
      providesTags: ["Product"],
    }),

    trackWhatsappClick: builder.mutation<{ ok: boolean }, string>({
      query: (productId) => ({ url: `/public/products/${productId}/whatsapp-click`, method: "POST" }),
    }),

    // ── Reviews ───────────────────────────────────────────────────────────
    getProductReviews: builder.query<ProductReviews, string>({
      query: (productId) => `/public/products/${productId}/reviews`,
      providesTags: ["Review"],
    }),
    createReview: builder.mutation<Review, { productId: string; customerName: string; rating: number; comment?: string }>({
      query: ({ productId, ...body }) => ({ url: `/public/products/${productId}/reviews`, method: "POST", body }),
      invalidatesTags: ["Review", "Product"],
    }),

    // ── Orders ────────────────────────────────────────────────────────────
    createOrder: builder.mutation<Order, CreateOrderInput>({
      query: (body) => ({ url: "/public/orders", method: "POST", body }),
      invalidatesTags: ["Order"],
    }),
    getOrdersByIds: builder.query<Order[], string[]>({
      query: (ids) => ({ url: "/public/orders/by-ids", params: { ids: ids.join(",") } }),
      providesTags: ["Order"],
    }),
    stripeCheckout: builder.mutation<{ url: string; orderId: string; mock: boolean }, CreateOrderInput>({
      query: (body) => ({ url: "/public/stripe/checkout", method: "POST", body }),
      invalidatesTags: ["Order"],
    }),
    stripeMockConfirm: builder.mutation<Order, string>({
      query: (orderId) => ({ url: "/public/stripe/mock-confirm", method: "POST", body: { orderId } }),
      invalidatesTags: ["Order"],
    }),
    getPaymentConfig: builder.query<{ hosted: boolean }, void>({
      query: () => "/public/payment-config",
    }),
    getSellerOrders: builder.query<Order[], void>({
      query: () => "/seller/orders",
      providesTags: ["Order"],
    }),
    updateOrderStatus: builder.mutation<Order, { id: string; status: OrderStatus }>({
      query: ({ id, status }) => ({ url: `/seller/orders/${id}/status`, method: "PATCH", body: { status } }),
      invalidatesTags: ["Order"],
    }),

    // ── Seller ────────────────────────────────────────────────────────────
    getSeller: builder.query<Seller, void>({
      query: () => "/seller/me",
      providesTags: ["Seller"],
    }),
    getMyStore: builder.query<Store | null, void>({
      query: () => "/seller/store",
      providesTags: ["Store"],
    }),
    getMyProducts: builder.query<Product[], void>({
      query: () => "/seller/products",
      providesTags: ["Product"],
    }),
    getDashboardMetrics: builder.query<DashboardMetrics, void>({
      query: () => "/seller/dashboard",
      providesTags: ["Product"],
    }),
    updateStoreLanding: builder.mutation<Store | null, StoreLanding>({
      query: (body) => ({ url: "/seller/store/landing", method: "PATCH", body }),
      invalidatesTags: ["Store"],
    }),
    updateStorePayout: builder.mutation<Store | null, StorePayout>({
      query: (body) => ({ url: "/seller/store/payout", method: "PATCH", body }),
      invalidatesTags: ["Store"],
    }),
    upsertStore: builder.mutation<Store, Partial<Store>>({
      query: (body) => ({ url: "/seller/store", method: "PUT", body }),
      invalidatesTags: ["Store", "Seller"],
    }),
    createProduct: builder.mutation<Product, Partial<Product>>({
      query: (body) => ({ url: "/seller/products", method: "POST", body }),
      invalidatesTags: ["Product"],
    }),
    updateProduct: builder.mutation<Product, { id: string; values: Partial<Product> }>({
      query: ({ id, values }) => ({ url: `/seller/products/${id}`, method: "PUT", body: values }),
      invalidatesTags: ["Product"],
    }),
    deleteProduct: builder.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/seller/products/${id}`, method: "DELETE" }),
      invalidatesTags: ["Product"],
    }),
    boostProduct: builder.mutation<Product, { id: string; packageId: string }>({
      query: ({ id, packageId }) => ({ url: `/seller/products/${id}/boost`, method: "POST", body: { packageId } }),
      invalidatesTags: ["Product"],
    }),
    changePlan: builder.mutation<Seller, PlanId>({
      query: (planId) => ({ url: "/seller/plan", method: "PATCH", body: { planId } }),
      invalidatesTags: ["Seller"],
    }),
    subscriptionCheckout: builder.mutation<{ url: string; orderId: string; planId: string }, PlanId>({
      query: (planId) => ({ url: "/seller/subscription/checkout", method: "POST", body: { planId } }),
      invalidatesTags: ["Seller"],
    }),
    getSubscriptionStatus: builder.query<{
      planId: PlanId;
      subscriptionStatus: string;
      subscriptionEndsAt: string | null;
      autoRenew: boolean;
      daysRemaining: number;
      hasCardToken: boolean;
    }, void>({
      query: () => "/seller/subscription/status",
      providesTags: ["Seller"],
    }),
    toggleAutoRenew: builder.mutation<{ autoRenew: boolean }, void>({
      query: () => ({ url: "/seller/subscription/toggle-auto-renew", method: "POST" }),
      invalidatesTags: ["Seller"],
    }),
    cancelSubscription: builder.mutation<{ ok: boolean; subscriptionStatus: string; subscriptionEndsAt: string | null }, void>({
      query: () => ({ url: "/seller/subscription/cancel", method: "POST" }),
      invalidatesTags: ["Seller"],
    }),
    getMyPayments: builder.query<Payment[], void>({
      query: () => "/seller/payments",
      providesTags: ["Payment"],
    }),

    // ── Admin ─────────────────────────────────────────────────────────────
    getAllSellers: builder.query<Seller[], void>({
      query: () => "/admin/sellers",
      providesTags: ["Seller"],
    }),
    getAllStores: builder.query<Store[], void>({
      query: () => "/admin/stores",
      providesTags: ["Store"],
    }),
    getAllProducts: builder.query<ProductWithStore[], void>({
      query: () => "/admin/products",
      providesTags: ["Product"],
    }),
    moderateProduct: builder.mutation<Product, { id: string; moderationStatus: ModerationStatus; reason?: string }>({
      query: ({ id, ...body }) => ({ url: `/admin/products/${id}/moderation`, method: "PATCH", body }),
      invalidatesTags: ["Product"],
    }),
    updateSeller: builder.mutation<Seller, { id: string; status?: SellerStatus; planId?: PlanId; subscriptionStatus?: SubscriptionStatus }>({
      query: ({ id, ...patch }) => ({ url: `/admin/sellers/${id}`, method: "PATCH", body: patch }),
      invalidatesTags: ["Seller"],
    }),
    updateStoreStatus: builder.mutation<Store, { id: string; status: StoreStatus }>({
      query: ({ id, status }) => ({ url: `/admin/stores/${id}`, method: "PATCH", body: { status } }),
      invalidatesTags: ["Store"],
    }),
    getSellerPayments: builder.query<Payment[], string>({
      query: (sellerId) => `/admin/sellers/${sellerId}/payments`,
      providesTags: ["Payment"],
    }),
    recordPayment: builder.mutation<{ payment: Payment; seller: Seller }, { sellerId: string; planId: PlanId; amount: number; method: string; paidAt?: string; notes?: string; applyToSeller?: boolean; subscriptionStatus?: SubscriptionStatus }>({
      query: ({ sellerId, ...body }) => ({ url: `/admin/sellers/${sellerId}/payments`, method: "POST", body }),
      invalidatesTags: ["Payment", "Seller"],
    }),
    getAllReviews: builder.query<AdminReview[], void>({
      query: () => "/admin/reviews",
      providesTags: ["Review"],
    }),
    moderateReview: builder.mutation<Review, { id: string; status: ReviewStatus }>({
      query: ({ id, status }) => ({ url: `/admin/reviews/${id}`, method: "PATCH", body: { status } }),
      invalidatesTags: ["Review"],
    }),

    // ── Admin Plan Config ─────────────────────────────────────────────────
    getPublicPlanConfig: builder.query<Plan[], void>({
      query: () => "/public/plans",
    }),
    getAdminPlanConfig: builder.query<Plan[], void>({
      query: () => "/admin/plan-config",
      providesTags: ["Seller"],
    }),
    updateAdminPlanConfig: builder.mutation<Plan, { planId: PlanId; price: number; productLimit: number; imageLimit: number; videoLimit: number; enabled?: boolean }>({
      query: (body) => ({ url: "/admin/plan-config", method: "PATCH", body }),
      invalidatesTags: ["Seller"],
    }),

    // ── Banners ───────────────────────────────────────────────────────────
    getActiveBanners: builder.query<Banner[], string | undefined>({
      query: (category) => ({ url: "/public/banners", params: category ? { category } : {} }),
      providesTags: ["Banner"],
    }),
    getAllBanners: builder.query<Banner[], void>({
      query: () => "/admin/banners",
      providesTags: ["Banner"],
    }),
    createBanner: builder.mutation<Banner, Partial<Banner>>({
      query: (body) => ({ url: "/admin/banners", method: "POST", body }),
      invalidatesTags: ["Banner"],
    }),
    updateBanner: builder.mutation<Banner, { id: string; values: Partial<Banner> }>({
      query: ({ id, values }) => ({ url: `/admin/banners/${id}`, method: "PATCH", body: values }),
      invalidatesTags: ["Banner"],
    }),
    deleteBanner: builder.mutation<{ ok: boolean }, string>({
      query: (id) => ({ url: `/admin/banners/${id}`, method: "DELETE" }),
      invalidatesTags: ["Banner"],
    }),
  }),
});

/* ── C: Sync authSlice from RTK Query results ───────────────────────────── */
// Instead of manually dispatching setSellerSession in every component,
// we listen to RTK Query's matchFulfilled on auth endpoints and update
// authSlice automatically — single source of truth.

type AppStartListening = TypedStartListening<unknown, ThunkDispatch<unknown, unknown, UnknownAction>>;

export function setupAuthListeners(startListening: AppStartListening) {
  startListening({
    matcher: apiSlice.endpoints.loginSeller.matchFulfilled,
    effect: (action, api) => {
      setToken(action.payload.token);
      api.dispatch(setSellerSession(action.payload.seller));
    },
  });

  startListening({
    matcher: apiSlice.endpoints.signupSeller.matchFulfilled,
    effect: (action, api) => {
      setToken(action.payload.token);
      api.dispatch(setSellerSession(action.payload.seller));
    },
  });

  startListening({
    matcher: apiSlice.endpoints.loginAdmin.matchFulfilled,
    effect: (action, api) => {
      setToken(action.payload.token);
      api.dispatch(setAdminSession({ name: action.payload.admin.name }));
    },
  });

  startListening({
    matcher: apiSlice.endpoints.getSeller.matchFulfilled,
    effect: (action, api) => {
      api.dispatch(setSellerSession(action.payload));
    },
  });
}

/* ── Exports ────────────────────────────────────────────────────────────── */

export const {
  useLoginSellerMutation,
  useSignupSellerMutation,
  useLoginAdminMutation,
  useGetMeQuery,
  useTrackWhatsappClickMutation,
  useGetPublicStoresQuery,
  useGetStoreBySlugQuery,
  useGetStoreProductsQuery,
  useGetProductQuery,
  useSearchProductsQuery,
  useGetProductReviewsQuery,
  useCreateReviewMutation,
  useCreateOrderMutation,
  useGetOrdersByIdsQuery,
  useStripeCheckoutMutation,
  useStripeMockConfirmMutation,
  useGetPaymentConfigQuery,
  useGetSellerOrdersQuery,
  useUpdateOrderStatusMutation,
  useGetSellerQuery,
  useGetMyStoreQuery,
  useGetMyProductsQuery,
  useGetDashboardMetricsQuery,
  useUpdateStoreLandingMutation,
  useUpdateStorePayoutMutation,
  useUpsertStoreMutation,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useBoostProductMutation,
  useChangePlanMutation,
  useSubscriptionCheckoutMutation,
  useGetSubscriptionStatusQuery,
  useToggleAutoRenewMutation,
  useCancelSubscriptionMutation,
  useGetMyPaymentsQuery,
  useGetAllSellersQuery,
  useGetAllStoresQuery,
  useGetAllProductsQuery,
  useModerateProductMutation,
  useUpdateSellerMutation,
  useUpdateStoreStatusMutation,
  useGetSellerPaymentsQuery,
  useRecordPaymentMutation,
  useGetAllReviewsQuery,
  useModerateReviewMutation,
  useGetAdminPlanConfigQuery,
  useUpdateAdminPlanConfigMutation,
  useGetPublicPlanConfigQuery,
  useGetActiveBannersQuery,
  useGetAllBannersQuery,
  useCreateBannerMutation,
  useUpdateBannerMutation,
  useDeleteBannerMutation,
} = apiSlice;
