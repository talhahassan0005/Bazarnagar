"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { Search } from "lucide-react";
import { Button, EmptyState, ProductGridSkeleton, Skeleton } from "@/components/ui";
import { StoreHeader } from "@/components/domain/StoreHeader";
import { ProductCard } from "@/components/domain/ProductCard";
import { CategoryChips } from "@/components/domain/CategoryChips";
import { useGetStoreBySlugQuery, useGetStoreProductsQuery } from "@/store/apiSlice";

export default function PublicStorePage() {
  const { slug } = useParams<{ slug: string }>();
  const store = useGetStoreBySlugQuery(slug);
  const products = useGetStoreProductsQuery(
    { storeId: store.data?.id ?? "", publicOnly: true },
    { skip: !store.data }
  );

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");

  const list = useMemo(() => products.data ?? [], [products.data]);
  const categories = useMemo(
    () => Array.from(new Set(list.map((p) => p.category))),
    [list]
  );

  const filtered = list.filter((p) => {
    if (category && p.category !== category) return false;
    if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
    return true;
  });

  if (store.isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <Skeleton className="h-36 rounded-none sm:h-48" />
          <div className="space-y-3 px-4 pb-5 pt-3 sm:px-6">
            <Skeleton className="-mt-14 h-20 w-20 rounded-2xl" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        </div>
        <div className="mt-6">
          <ProductGridSkeleton />
        </div>
      </div>
    );
  }

  if (!store.data) {
    return (
      <div className="mx-auto w-full max-w-[1600px] px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          title="Shop not found"
          description="This store link may be incorrect or the shop is no longer available."
          action={<Button href="/search">Browse other shops</Button>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-6">
      <StoreHeader store={store.data} />

      {/* Search + categories */}
      <div className="sticky top-16 z-20 mt-6 space-y-3 bg-slate-50/80 py-2 backdrop-blur">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search this shop…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        {categories.length > 1 && (
          <CategoryChips categories={categories} value={category} onChange={setCategory} />
        )}
      </div>

      {/* Products */}
      <div className="mt-4">
        {products.isLoading || products.isUninitialized ? (
          <ProductGridSkeleton />
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title="No products found"
            description="Try a different search or category."
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} store={store.data!} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
