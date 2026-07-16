"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight, Navigation } from "lucide-react";
import { ProductCard } from "@/components/domain/ProductCard";
import { Button, ProductGridSkeleton } from "@/components/ui";
import { useSearchProductsQuery } from "@/store/apiSlice";
import { CATEGORIES } from "@/lib/constants";
import { cn, distanceKm } from "@/lib/utils";

const chip = (active: boolean) =>
  cn(
    "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
    active
      ? "border-brand-600 bg-brand-600 text-white"
      : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
  );

/**
 * Homepage catalog — category chips FILTER the product grid in place (no
 * redirect). "Near me" asks for the device location and re-orders products
 * closest-first. Featured/boosted products come first otherwise.
 */
export function HomeCatalog() {
  const [category, setCategory] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");

  const { data, isLoading } = useSearchProductsQuery({ category });

  function nearMe() {
    if (coords) {
      setCoords(null); // toggle off
      return;
    }
    setGeoError("");
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Your browser doesn't support location.");
      return;
    }
    setLocating(true);
    // Triggers the browser's location-permission prompt.
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocating(false);
      },
      (err) => {
        setLocating(false);
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? "Location access denied. Enable it in your browser to see nearby products."
            : "Couldn't get your location. Please try again."
        );
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  // Attach distance (product location, else its store's) and sort nearest-first.
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
  }
  const shown = items.slice(0, 18);

  return (
    <>
      {/* Category filter bar */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-brand-900">Shop by category</h2>
            <div className="flex items-center gap-3">
              <Button
                variant={coords ? "primary" : "outline"}
                size="sm"
                loading={locating}
                leftIcon={<Navigation className="h-4 w-4" />}
                onClick={nearMe}
              >
                {coords ? "Showing nearby" : "Near me"}
              </Button>
              <Link href="/search" className="text-sm font-medium text-brand-700 hover:underline">
                Advanced search →
              </Link>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            <button type="button" onClick={() => setCategory("")} className={chip(category === "")}>
              All
            </button>
            {CATEGORIES.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={chip(category === c)}
              >
                {c}
              </button>
            ))}
          </div>
          {geoError && <p className="mt-3 text-xs font-medium text-red-500">{geoError}</p>}
          {coords && !geoError && (
            <p className="mt-3 text-xs font-medium text-brand-700">
              📍 Showing products nearest to you first.
            </p>
          )}
        </div>
      </section>

      {/* Filtered products */}
      <section className="mx-auto w-full max-w-[1600px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-brand-900">
              {coords ? "Nearby products" : category ? `${category}` : "Popular products"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {coords
                ? "Sorted by distance from your location."
                : category
                  ? `Browsing ${category.toLowerCase()} from shops across Pakistan.`
                  : "Fresh picks from shops across Pakistan."}
            </p>
          </div>
          <Link
            href={category ? `/search?category=${encodeURIComponent(category)}` : "/search"}
            className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="mt-6">
          {isLoading ? (
            <ProductGridSkeleton />
          ) : shown.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-400">
              No products in {category || "this catalog"} yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {shown.map(({ product, distance }) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  store={product.store}
                  distanceKm={distance}
                />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
