"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { EmptyState, ProductGridSkeleton } from "@/components/ui";
import { ProductCard } from "@/components/domain/ProductCard";
import { CategoryChips } from "@/components/domain/CategoryChips";
import { useGetStoreProductsQuery } from "@/store/apiSlice";
import type { Store } from "@/lib/types";

/**
 * Searchable / filterable product grid for a store. Used by the catalog route
 * (`/store/[slug]/products`) and as the fallback when a store's landing page
 * is disabled.
 */
export function StoreCatalog({ store }: { store: Store }) {
  const products = useGetStoreProductsQuery({ storeId: store.id, publicOnly: true });

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

  return (
    <>
      {/* Search + categories */}
      <div className="sticky top-16 z-20 space-y-3 bg-slate-50/80 py-2 backdrop-blur">
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
              <ProductCard key={p.id} product={p} store={store} />
            ))}
          </div>
        )}
      </div>
    </>
  );
}
