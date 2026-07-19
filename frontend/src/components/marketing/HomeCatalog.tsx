"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import Link from "next/link";
import { ArrowRight, Navigation } from "lucide-react";
import { ProductCard } from "@/components/domain/ProductCard";
import { Button, ProductGridSkeleton } from "@/components/ui";
import { useSearchProductsQuery } from "@/store/apiSlice";
import { CATEGORIES } from "@/lib/constants";
import { cn, distanceKm } from "@/lib/utils";

const NAVBAR_H = 64;
const SECTION_OFFSET = 80; // px below navbar to trigger active

const chip = (active: boolean) =>
  cn(
    "shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors",
    active
      ? "border-brand-600 bg-brand-600 text-white"
      : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
  );

export function HomeCatalog() {
  const [activeCategory, setActiveCategory] = useState("");
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState("");
  const [isSticky, setIsSticky] = useState(false);

  const filterBarRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const userSelectedRef = useRef(false);

  // Fetch all products (no category filter — we group client-side)
  const { data, isLoading } = useSearchProductsQuery({});

  const items = (data ?? []).map((p) => {
    const plat = p.lat ?? p.store.lat;
    const plng = p.lng ?? p.store.lng;
    const distance = coords && plat != null && plng != null
      ? distanceKm(coords.lat, coords.lng, plat, plng) : undefined;
    return { product: p, distance };
  });
  if (coords) items.sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity));

  // Group by category; boosted/featured products first in "All" view
  const featured = items.filter(({ product: p }) => p.boostedUntil && new Date(p.boostedUntil) > new Date());
  const grouped = CATEGORIES.map((cat) => ({
    cat,
    items: items.filter(({ product: p }) => p.category === cat),
  })).filter(({ items }) => items.length > 0);

  const updateActiveFromScroll = useCallback(() => {
    const el = filterBarRef.current;
    if (!el) return;
    setIsSticky(el.getBoundingClientRect().bottom < NAVBAR_H);
    if (userSelectedRef.current) return;
    const threshold = NAVBAR_H + SECTION_OFFSET;
    let current = "";
    for (const cat of ["", ...CATEGORIES]) {
      const sec = sectionRefs.current[cat];
      if (!sec) continue;
      if (sec.getBoundingClientRect().top <= threshold) current = cat;
    }
    setActiveCategory(current);
  }, []);

  useEffect(() => {
    window.addEventListener("scroll", updateActiveFromScroll, { passive: true });
    return () => window.removeEventListener("scroll", updateActiveFromScroll);
  }, [updateActiveFromScroll]);

  function scrollToCategory(c: string) {
    setActiveCategory(c);
    userSelectedRef.current = true;
    const sec = sectionRefs.current[c];
    if (sec) {
      const top = sec.getBoundingClientRect().top + window.scrollY - NAVBAR_H - 8;
      window.scrollTo({ top, behavior: "smooth" });
    }
    setTimeout(() => { userSelectedRef.current = false; }, 800);
  }

  function nearMe() {
    if (coords) { setCoords(null); return; }
    setGeoError("");
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Your browser doesn't support location."); return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => { setCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocating(false); },
      (err) => {
        setLocating(false);
        setGeoError(err.code === err.PERMISSION_DENIED
          ? "Location access denied. Enable it in your browser to see nearby products."
          : "Couldn't get your location. Please try again.");
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }

  const ChipBar = () => (
    <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      <button type="button" onClick={() => scrollToCategory("")} className={chip(activeCategory === "")}>All</button>
      {CATEGORIES.map((c) => (
        <button key={c} type="button" onClick={() => scrollToCategory(c)} className={chip(activeCategory === c)}>{c}</button>
      ))}
    </div>
  );

  return (
    <>
      {/* Sticky floating category bar */}
      {isSticky && (
        <div className="fixed top-16 left-0 right-0 z-30 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur-sm">
          <div className="mx-auto w-full max-w-[1600px] px-4 py-2 sm:px-6 lg:px-8">
            <ChipBar />
          </div>
        </div>
      )}

      {/* Inline category filter bar (sentinel) */}
      <section ref={filterBarRef} className="border-y border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-brand-900">Shop by category</h2>
            <div className="flex items-center gap-3">
              <Button variant={coords ? "primary" : "outline"} size="sm" loading={locating}
                leftIcon={<Navigation className="h-4 w-4" />} onClick={nearMe}>
                {coords ? "Showing nearby" : "Near me"}
              </Button>
              <Link href="/search" className="text-sm font-medium text-brand-700 hover:underline">
                Advanced search →
              </Link>
            </div>
          </div>
          <div className="mt-4">
            <ChipBar />
          </div>
          {geoError && <p className="mt-3 text-xs font-medium text-red-500">{geoError}</p>}
          {coords && !geoError && (
            <p className="mt-3 text-xs font-medium text-brand-700">📍 Showing products nearest to you first.</p>
          )}
        </div>
      </section>

      {/* Products — grouped by category with scroll-spy anchors */}
      <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">
        {isLoading ? (
          <div className="py-12"><ProductGridSkeleton /></div>
        ) : (
          <>
            {/* Featured / All section */}
            <section
              ref={(el) => { sectionRefs.current[""] = el; }}
              id="cat-all"
              className="py-10"
            >
              <div className="flex items-end justify-between gap-3 mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-brand-900">
                    {coords ? "Nearby products" : "Popular products"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {coords ? "Sorted by distance from your location." : "Fresh picks from shops across Pakistan."}
                  </p>
                </div>
                <Link href="/search" className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
                  View all <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
              {featured.length === 0 && !coords ? (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {items.slice(0, 6).map(({ product, distance }, i) => (
                    <ProductCard key={product.id} product={product} store={product.store} distanceKm={distance} index={i} />
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {(coords ? items : featured).slice(0, 6).map(({ product, distance }, i) => (
                    <ProductCard key={product.id} product={product} store={product.store} distanceKm={distance} index={i} />
                  ))}
                </div>
              )}
            </section>

            {/* Per-category sections */}
            {!coords && grouped.map(({ cat, items: catItems }) => (
              <section
                key={cat}
                ref={(el) => { sectionRefs.current[cat] = el; }}
                id={`cat-${cat}`}
                className="border-t border-slate-100 py-10"
              >
                <div className="flex items-end justify-between gap-3 mb-6">
                  <div>
                    <h2 className="text-2xl font-bold text-brand-900">{cat}</h2>
                    <p className="mt-1 text-sm text-slate-500">
                      Browsing {cat.toLowerCase()} from shops across Pakistan.
                    </p>
                  </div>
                  <Link href={`/search?category=${encodeURIComponent(cat)}`}
                    className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand-700 hover:underline">
                    View all <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {catItems.slice(0, 6).map(({ product, distance }, i) => (
                    <ProductCard key={product.id} product={product} store={product.store} distanceKm={distance} index={i} />
                  ))}
                </div>
              </section>
            ))}
          </>
        )}
      </div>
    </>
  );
}
