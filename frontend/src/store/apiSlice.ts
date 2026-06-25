import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { api } from "@/lib/api";
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
} from "@/lib/types";

/**
 * Run an API call and convert it into RTK Query's `{ data } | { error }`
 * shape. This keeps thrown errors out of the console as "unhandled" and lets
 * `.unwrap()` reject with a clean `{ message }` the UI can show the user.
 */
async function run<T>(
  fn: () => Promise<T>
): Promise<{ data: T } | { error: { message: string } }> {
  try {
    return { data: await fn() };
  } catch (e) {
    return { error: { message: e instanceof Error ? e.message : "Request failed" } };
  }
}

/**
 * RTK Query API slice. Endpoints delegate to the HTTP client in `lib/api.ts`,
 * which talks to the Express + MongoDB backend. Seller/admin calls send the
 * JWT automatically (stored by `lib/api.ts`).
 */
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fakeBaseQuery<{ message: string }>(),
  tagTypes: ["Product", "Store", "Seller", "Order", "Review", "Payment"],
  endpoints: (builder) => ({
    // ---- Public / customer ----
    getPublicStores: builder.query<Store[], { q?: string; city?: string }>({
      queryFn: (params) => run(() => api.getStores(params)),
      providesTags: ["Store"],
    }),
    getStoreBySlug: builder.query<Store | null, string>({
      queryFn: (slug) => run(() => api.getStoreBySlug(slug)),
      providesTags: ["Store"],
    }),
    getStoreProducts: builder.query<
      Product[],
      { storeId: string; publicOnly?: boolean }
    >({
      queryFn: ({ storeId, publicOnly }) =>
        run(() => api.getStoreProducts(storeId, { publicOnly })),
      providesTags: ["Product"],
    }),
    getProduct: builder.query<ProductWithStore | null, string>({
      queryFn: (id) => run(() => api.getProduct(id)),
      providesTags: ["Product"],
    }),
    searchProducts: builder.query<
      ProductWithStore[],
      { q?: string; category?: string; city?: string; area?: string }
    >({
      queryFn: (params) => run(() => api.searchProducts(params)),
      providesTags: ["Product"],
    }),

    // ---- Reviews & ratings ----
    getProductReviews: builder.query<ProductReviews, string>({
      queryFn: (productId) => run(() => api.getProductReviews(productId)),
      providesTags: ["Review"],
    }),
    createReview: builder.mutation<
      Review,
      { productId: string; customerName: string; rating: number; comment?: string }
    >({
      queryFn: ({ productId, ...body }) => run(() => api.createReview(productId, body)),
      invalidatesTags: ["Review", "Product"],
    }),

    // ---- Orders ----
    createOrder: builder.mutation<Order, CreateOrderInput>({
      queryFn: (input) => run(() => api.createOrder(input)),
      invalidatesTags: ["Order"],
    }),
    createCheckout: builder.mutation<{ url: string; orderId: string }, CreateOrderInput>({
      queryFn: (input) => run(() => api.createCheckoutSession(input)),
      invalidatesTags: ["Order"],
    }),
    getSellerOrders: builder.query<Order[], void>({
      queryFn: () => run(() => api.getSellerOrders()),
      providesTags: ["Order"],
    }),
    updateOrderStatus: builder.mutation<Order, { id: string; status: OrderStatus }>({
      queryFn: ({ id, status }) => run(() => api.updateOrderStatus(id, status)),
      invalidatesTags: ["Order"],
    }),

    // ---- Seller (identity comes from the JWT) ----
    getSeller: builder.query<Seller, string | undefined>({
      queryFn: () => run(() => api.getSeller()),
      providesTags: ["Seller"],
    }),
    getMyStore: builder.query<Store | null, string | undefined>({
      queryFn: () => run(() => api.getMyStore()),
      providesTags: ["Store"],
    }),
    getMyProducts: builder.query<Product[], string | undefined>({
      queryFn: () => run(() => api.getMyProducts()),
      providesTags: ["Product"],
    }),
    getDashboardMetrics: builder.query<DashboardMetrics, string | undefined>({
      queryFn: () => run(() => api.getDashboardMetrics()),
      providesTags: ["Product"],
    }),
    updateStoreLanding: builder.mutation<Store | null, StoreLanding>({
      queryFn: (landing) => run(() => api.updateStoreLanding(landing)),
      invalidatesTags: ["Store"],
    }),
    updateStorePayment: builder.mutation<Store | null, StoreStripe>({
      queryFn: (stripe) => run(() => api.updatePayment(stripe)),
      invalidatesTags: ["Store"],
    }),
    upsertStore: builder.mutation<Store, Partial<Store>>({
      queryFn: (values) => run(() => api.upsertStore(values)),
      invalidatesTags: ["Store", "Seller"],
    }),
    createProduct: builder.mutation<Product, Partial<Product>>({
      queryFn: (values) => run(() => api.createProduct(values)),
      invalidatesTags: ["Product"],
    }),
    updateProduct: builder.mutation<Product, { id: string; values: Partial<Product> }>({
      queryFn: ({ id, values }) => run(() => api.updateProduct(id, values)),
      invalidatesTags: ["Product"],
    }),
    deleteProduct: builder.mutation<{ ok: boolean }, string>({
      queryFn: (id) => run(() => api.deleteProduct(id)),
      invalidatesTags: ["Product"],
    }),
    changePlan: builder.mutation<Seller, PlanId>({
      queryFn: (planId) => run(() => api.changePlan(planId)),
      invalidatesTags: ["Seller"],
    }),

    // ---- Admin ----
    getAllSellers: builder.query<Seller[], void>({
      queryFn: () => run(() => api.getAllSellers()),
      providesTags: ["Seller"],
    }),
    getAllStores: builder.query<Store[], void>({
      queryFn: () => run(() => api.getAllStores()),
      providesTags: ["Store"],
    }),
    getAllProducts: builder.query<ProductWithStore[], void>({
      queryFn: () => run(() => api.getAllProducts()),
      providesTags: ["Product"],
    }),
    moderateProduct: builder.mutation<
      Product,
      { id: string; moderationStatus: ModerationStatus; reason?: string }
    >({
      queryFn: ({ id, moderationStatus, reason }) =>
        run(() => api.moderateProduct(id, moderationStatus, reason)),
      invalidatesTags: ["Product"],
    }),
    updateSeller: builder.mutation<
      Seller,
      {
        id: string;
        status?: SellerStatus;
        planId?: PlanId;
        subscriptionStatus?: SubscriptionStatus;
      }
    >({
      queryFn: ({ id, ...patch }) => run(() => api.updateSeller(id, patch)),
      invalidatesTags: ["Seller"],
    }),
    updateStoreStatus: builder.mutation<Store, { id: string; status: StoreStatus }>({
      queryFn: ({ id, status }) => run(() => api.updateStore(id, status)),
      invalidatesTags: ["Store"],
    }),
    getSellerPayments: builder.query<Payment[], string>({
      queryFn: (sellerId) => run(() => api.getSellerPayments(sellerId)),
      providesTags: ["Payment"],
    }),
    recordPayment: builder.mutation<
      { payment: Payment; seller: Seller },
      {
        sellerId: string;
        planId: PlanId;
        amount: number;
        method: string;
        paidAt?: string;
        notes?: string;
        applyToSeller?: boolean;
        subscriptionStatus?: SubscriptionStatus;
      }
    >({
      queryFn: ({ sellerId, ...body }) => run(() => api.recordPayment(sellerId, body)),
      invalidatesTags: ["Payment", "Seller"],
    }),
    getAllReviews: builder.query<AdminReview[], void>({
      queryFn: () => run(() => api.getAllReviews()),
      providesTags: ["Review"],
    }),
    moderateReview: builder.mutation<Review, { id: string; status: ReviewStatus }>({
      queryFn: ({ id, status }) => run(() => api.moderateReview(id, status)),
      invalidatesTags: ["Review"],
    }),
  }),
});

export const {
  useGetPublicStoresQuery,
  useGetStoreBySlugQuery,
  useGetStoreProductsQuery,
  useGetProductQuery,
  useSearchProductsQuery,
  useGetProductReviewsQuery,
  useCreateReviewMutation,
  useCreateOrderMutation,
  useCreateCheckoutMutation,
  useGetSellerOrdersQuery,
  useUpdateOrderStatusMutation,
  useGetSellerQuery,
  useGetMyStoreQuery,
  useGetMyProductsQuery,
  useGetDashboardMetricsQuery,
  useUpdateStoreLandingMutation,
  useUpdateStorePaymentMutation,
  useUpsertStoreMutation,
  useCreateProductMutation,
  useUpdateProductMutation,
  useDeleteProductMutation,
  useChangePlanMutation,
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
} = apiSlice;
