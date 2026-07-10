"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowDownUp, Navigation, Search, SlidersHorizontal } from "lucide-react";
import { Button, EmptyState, ProductGridSkeleton } from "@/components/ui";
import { ProductCard } from "@/components/domain/ProductCard";
import { CategoryChips } from "@/components/domain/CategoryChips";
import { useSearchProductsQuery } from "@/store/apiSlice";
import { CATEGORIES, CITIES } from "@/lib/constants";
import { distanceKm, effectivePrice } from "@/lib/utils";

type Sort = "relevance" | "price-asc" | "price-desc";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [city, setCity] = useState("");
  const [sort, setSort] = useState<Sort>("relevance");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);

  // Seed filters from the URL (e.g. /search?category=Clothing from the homepage).
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const c = params.get("category");
    const q = params.get("q");
    if (c) setCategory(c);
    if (q) setQuery(q);
  }, []);

  function nearMe() {
    if (coords) {
      setCoords(null); // toggle off
      return;
    }
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

  const { data, isLoading } = useSearchProductsQuery({ q: query, category, city });

  // Attach distance (product location, else its store's) and sort.
  const items = (data ?? []).map((p) => {
    const plat = p.lat ?? p.store.lat;
    const plng = p.lng ?? p.store.lng;
    const distance =
      coords && plat != null && plng != null
        ? distanceKm(coords.lat, coords.lng, plat, plng)
        : undefined;
    return { product: p, distance };
  });

  if (coords) {
    items.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));
  } else if (sort === "price-asc") {
    items.sort((a, b) => effectivePrice(a.product) - effectivePrice(b.product));
  } else if (sort === "price-desc") {
    items.sort((a, b) => effectivePrice(b.product) - effectivePrice(a.product));
  }

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
        <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap">
          <div className="relative flex-1 sm:min-w-[220px]">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search products, shops, tags…"
              className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
            />
          </div>
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
            <SlidersHorizontal className="h-4 w-4 shrink-0 text-slate-400" />
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
          <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3">
            <ArrowDownUp className="h-4 w-4 shrink-0 text-slate-400" />
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as Sort)}
              disabled={!!coords}
              className="bg-transparent py-2.5 text-sm outline-none disabled:opacity-50"
              aria-label="Sort products"
            >
              <option value="relevance">Relevance</option>
              <option value="price-asc">Price: Low to High</option>
              <option value="price-desc">Price: High to Low</option>
            </select>
          </div>
          <Button
            variant={coords ? "primary" : "outline"}
            loading={locating}
            leftIcon={<Navigation className="h-4 w-4" />}
            onClick={nearMe}
          >
            {coords ? "Nearest first" : "Near me"}
          </Button>
        </div>

        {coords && (
          <p className="text-xs text-brand-700">
            Showing products nearest to your location first.
          </p>
        )}

        <CategoryChips categories={[...CATEGORIES]} value={category} onChange={setCategory} />
      </div>

      {/* Results */}
      <div className="mt-6">
        {isLoading ? (
          <ProductGridSkeleton />
        ) : items.length === 0 ? (
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
                  setCoords(null);
                }}
              >
                Clear filters
              </Button>
            }
          />
        ) : (
          <>
            <p className="mb-3 text-sm text-slate-500">{items.length} products found</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {items.map(({ product, distance }) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  store={product.store}
                  distanceKm={distance}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
