"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Navigation, Search, SlidersHorizontal, Store as StoreIcon } from "lucide-react";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import { StoreCard } from "@/components/storefront/StoreCard";
import { useGetPublicStoresQuery } from "@/store/apiSlice";
import { useFilterCities } from "@/components/domain/CitySelect";
import { useCountry } from "@/lib/useCountry";
import { distanceKm } from "@/lib/utils";

const PAGE_SIZE = 24;

export default function ShopsPage() {
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("");
  const [page, setPage] = useState(1);
  const cities = useFilterCities();
  const { country } = useCountry();
  const isPakistan = country === "Pakistan";
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  // Reset to page 1 on filter change
  useEffect(() => { setPage(1); }, [query, city, coords]);

  const { data, isLoading } = useGetPublicStoresQuery({ q: query, city });
  const results = data ?? [];

  function nearMe() {
    if (coords) { setCoords(null); return; }
    if (typeof navigator === "undefined" || !navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      () => setLocating(false),
      { timeout: 10000 }
    );
  }

  const shops = useMemo(() => {
    const list = results.map((store) => ({
      store,
      distance:
        coords && store.lat != null && store.lng != null
          ? distanceKm(coords.lat, coords.lng, store.lat, store.lng)
          : undefined,
    }));
    if (coords) {
      list.sort((a, b) => {
        if (a.distance == null && b.distance == null) return 0;
        if (a.distance == null) return 1;
        if (b.distance == null) return -1;
        return a.distance - b.distance;
      });
    }
    return list;
  }, [results, coords]);

  const totalPages = Math.ceil(shops.length / PAGE_SIZE);
  const paginated = useMemo(
    () => shops.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [shops, page]
  );

  function goToPage(p: number) {
    setPage(p);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

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
        {isPakistan && (
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-400" />
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="bg-transparent py-2.5 text-sm outline-none"
            >
              <option value="">All cities</option>
              {cities.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
        )}
        <Button
          variant={coords ? "primary" : "outline"}
          loading={locating}
          leftIcon={<Navigation className="h-4 w-4" />}
          onClick={nearMe}
        >
          {coords ? "Sorted by distance" : "Shops near me"}
        </Button>
      </div>

      {/* Results */}
      <div className="mt-6">
        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}
          </div>
        ) : shops.length === 0 ? (
          <EmptyState
            icon={<StoreIcon className="h-6 w-6" />}
            title="No shops found"
            description="Try a different search or clear the filters."
            action={
              <Button variant="outline" onClick={() => { setQuery(""); setCity(""); setCoords(null); }}>
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-500">
              {shops.length} shops{totalPages > 1 ? ` · Page ${page} of ${totalPages}` : ""}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {paginated.map(({ store, distance }) => (
                <StoreCard key={store.id} store={store} distanceKm={distance} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="mt-8 flex items-center justify-center gap-1.5">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((p) => p === 1 || p === totalPages || (p >= page - 1 && p <= page + 1))
                  .reduce<(number | "…")[]>((acc, p, idx, arr) => {
                    if (idx > 0 && (p as number) - (arr[idx - 1] as number) > 1) acc.push("…");
                    acc.push(p);
                    return acc;
                  }, [])
                  .map((p, i) =>
                    p === "…" ? (
                      <span key={`e${i}`} className="px-1 text-slate-400">…</span>
                    ) : (
                      <button
                        key={p}
                        onClick={() => goToPage(p as number)}
                        className={`flex h-9 min-w-[36px] items-center justify-center rounded-lg border px-3 text-sm font-medium transition ${
                          p === page
                            ? "border-brand-600 bg-brand-600 text-white"
                            : "border-slate-200 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}

                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                  className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
