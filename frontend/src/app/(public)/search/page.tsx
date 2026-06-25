"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal } from "lucide-react";
import { Button, EmptyState, ProductGridSkeleton } from "@/components/ui";
import { ProductCard } from "@/components/domain/ProductCard";
import { CategoryChips } from "@/components/domain/CategoryChips";
import { useSearchProductsQuery } from "@/store/apiSlice";
import { CATEGORIES, CITIES } from "@/lib/constants";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");

  const { data, isLoading } = useSearchProductsQuery({ q: query, category, city });

  const results = data ?? [];

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Browse products</h1>
          <p className="mt-1 text-sm text-slate-500">
            Search across all shops by name, category, city and more.
          </p>
        </div>
        <Link href="/shops" className="text-sm font-medium text-brand-700 hover:underline">
          Prefer to browse by shop? Browse shops →
        </Link>
      </div>

      {/* Search controls */}
      <div className="mt-5 space-y-3">
        <div className="flex flex-col gap-3 sm:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, shops, tags…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
            <SlidersHorizontal className="h-4 w-4 text-slate-400" />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="bg-transparent py-2.5 text-sm outline-none"
            >
              <option value="">All cities</option>
              {CITIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        </div>

        <CategoryChips categories={[...CATEGORIES]} value={category} onChange={setCategory} />
      </div>

      {/* Results */}
      <div className="mt-6">
        {isLoading ? (
          <ProductGridSkeleton />
        ) : results.length === 0 ? (
          <EmptyState
            icon={<Search className="h-6 w-6" />}
            title="No products found"
            description="Try different keywords or clear the filters."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setCategory("");
                  setCity("");
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-500">{results.length} products found</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {results.map((p) => (
                <ProductCard key={p.id} product={p} store={p.store} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
