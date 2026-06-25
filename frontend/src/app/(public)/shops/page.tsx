"use client";

import { useState } from "react";
import Link from "next/link";
import { Search, SlidersHorizontal, Store as StoreIcon } from "lucide-react";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import { StoreCard } from "@/components/storefront/StoreCard";
import { useGetPublicStoresQuery } from "@/store/apiSlice";
import { CITIES } from "@/lib/constants";

export default function ShopsPage() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");

  const { data, isLoading } = useGetPublicStoresQuery({ q: query, city });
  const results = data ?? [];

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-brand-900">Browse shops</h1>
          <p className="mt-1 text-sm text-slate-500">
            Discover stores by name, category or city.
          </p>
        </div>
        <Link href="/search" className="text-sm font-medium text-brand-700 hover:underline">
          Looking for a product? Browse products →
        </Link>
      </div>

      {/* Search controls */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search shops by name, category…"
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

      {/* Results */}
      <div className="mt-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}
          </div>
        ) : results.length === 0 ? (
          <EmptyState
            icon={<StoreIcon className="h-6 w-6" />}
            title="No shops found"
            description="Try a different search or clear the filters."
            action={
              <Button
                variant="outline"
                onClick={() => {
                  setQuery("");
                  setCity("");
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-500">{results.length} shops</p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {results.map((store) => (
                <StoreCard key={store.id} store={store} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
