import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { api } from "@/lib/api";
import type {
  DashboardMetrics,
  Product,
  ProductWithStore,
  Seller,
  Store,
} from "@/lib/types";

/**
 * RTK Query API slice.
 *
 * Endpoints currently resolve through the in-memory mock layer (`lib/api.ts`)
 * via `queryFn`. When the Express backend lands, swap `fakeBaseQuery()` for
 * `fetchBaseQuery({ baseUrl: API_BASE })` and replace each `queryFn` with a
 * `query: () => "/path"` — component hooks stay identical.
 */
export const apiSlice = createApi({
  reducerPath: "api",
  baseQuery: fakeBaseQuery(),
  tagTypes: ["Product", "Store", "Seller"],
  endpoints: (builder) => ({
    // ---- Public / customer ----
    getStoreBySlug: builder.query<Store | null, string>({
      queryFn: async (slug) => ({ data: await api.getStoreBySlug(slug) }),
      providesTags: ["Store"],
    }),
    getStoreProducts: builder.query<
      Product[],
      { storeId: string; publicOnly?: boolean }
    >({
      queryFn: async ({ storeId, publicOnly }) => ({
        data: await api.getStoreProducts(storeId, { publicOnly }),
      }),
      providesTags: ["Product"],
    }),
    getProduct: builder.query<ProductWithStore | null, string>({
      queryFn: async (id) => ({ data: await api.getProduct(id) }),
      providesTags: ["Product"],
    }),
    searchProducts: builder.query<
      ProductWithStore[],
      { q?: string; category?: string; city?: string; area?: string }
    >({
      queryFn: async (params) => ({ data: await api.searchProducts(params) }),
      providesTags: ["Product"],
    }),

    // ---- Seller (scoped by sellerId from the auth slice) ----
    getSeller: builder.query<Seller, string | undefined>({
      queryFn: async (sellerId) => ({ data: await api.getSeller(sellerId) }),
      providesTags: ["Seller"],
    }),
    getMyStore: builder.query<Store | null, string | undefined>({
      queryFn: async (sellerId) => ({ data: await api.getMyStore(sellerId) }),
      providesTags: ["Store"],
    }),
    getMyProducts: builder.query<Product[], string | undefined>({
      queryFn: async (sellerId) => ({ data: await api.getMyProducts(sellerId) }),
      providesTags: ["Product"],
    }),
    getDashboardMetrics: builder.query<DashboardMetrics, string | undefined>({
      queryFn: async (sellerId) => ({
        data: await api.getDashboardMetrics(sellerId),
      }),
      providesTags: ["Product"],
    }),

    // ---- Admin ----
    getAllSellers: builder.query<Seller[], void>({
      queryFn: async () => ({ data: await api.getAllSellers() }),
      providesTags: ["Seller"],
    }),
    getAllStores: builder.query<Store[], void>({
      queryFn: async () => ({ data: await api.getAllStores() }),
      providesTags: ["Store"],
    }),
    getAllProducts: builder.query<ProductWithStore[], void>({
      queryFn: async () => ({ data: await api.getAllProducts() }),
      providesTags: ["Product"],
    }),
  }),
});

export const {
  useGetStoreBySlugQuery,
  useGetStoreProductsQuery,
  useGetProductQuery,
  useSearchProductsQuery,
  useGetSellerQuery,
  useGetMyStoreQuery,
  useGetMyProductsQuery,
  useGetDashboardMetricsQuery,
  useGetAllSellersQuery,
  useGetAllStoresQuery,
  useGetAllProductsQuery,
} = apiSlice;
