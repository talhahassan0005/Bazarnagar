"use client";

import { useMemo, useRef, useState, useEffect } from "react";
import { Search } from "lucide-react";
import { EmptyState, ProductGridSkeleton } from "@/components/ui";
import { ProductCard } from "@/components/domain/ProductCard";
import { CategoryChips } from "@/components/domain/CategoryChips";
import { useGetStoreProductsQuery } from "@/store/apiSlice";
import { isBoosted } from "@/lib/utils";
import type { Store } from "@/lib/types";

export function StoreCatalog({ store }: { store: Store }) {
  const products = useGetStoreProductsQuery({ storeId: store.id, publicOnly: true });

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [categorySticky, setCategorySticky] = useState(false);

  const searchRef = useRef<HTMLDivElement>(null);

  // Show sticky category bar once the search input scrolls out of view.
  useEffect(() => {
    const el = searchRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => setCategorySticky(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const list = useMemo(() => products.data ?? [], [products.data]);
  const categories = useMemo(
    () => Array.from(new Set(list.map((p) => p.category))),
    [list]
  );

  const filtered = useMemo(() => {
    const result = list.filter((p) => {
      if (category && p.category !== category) return false;
      if (query && !p.name.toLowerCase().includes(query.toLowerCase())) return false;
      return true;
    });
    // Boosted products always sort first.
    return result.sort((a, b) => {
      const ab = isBoosted(a), bb = isBoosted(b);
      if (ab !== bb) return ab ? -1 : 1;
      return 0;
    });
  }, [list, category, query]);

  return (
    <>
      {/* Sticky floating category bar — appears after search scrolls away */}
      {categorySticky && categories.length > 1 && (
        <div className="fixed top-16 left-0 right-0 z-30 bg-white/90 backdrop-blur border-b border-slate-200 px-4 py-2 shadow-sm">
          <div className="mx-auto max-w-[1600px]">
            <CategoryChips categories={categories} value={category} onChange={setCategory} />
          </div>
        </div>
      )}

      {/* Search bar (sentinel for IntersectionObserver) */}
      <div ref={searchRef} className="sticky top-16 z-20 space-y-3 bg-slate-50/80 py-2 backdrop-blur">
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
