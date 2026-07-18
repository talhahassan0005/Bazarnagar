"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { EmptyState, ProductGridSkeleton } from "@/components/ui";
import { ProductCard } from "@/components/domain/ProductCard";
import { CategoryChips } from "@/components/domain/CategoryChips";
import { useGetStoreProductsQuery } from "@/store/apiSlice";
import { isBoosted } from "@/lib/utils";
import type { Store } from "@/lib/types";

const NAVBAR_H = 64;
const STICKY_BAR_H = 44;
const PAGE_SIZE = 12;

export function StoreCatalog({ store }: { store: Store }) {
  const products = useGetStoreProductsQuery({ storeId: store.id, publicOnly: true });

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("");
  const [isSticky, setIsSticky] = useState(false);
  const [page, setPage] = useState(1);

  const searchBarRef = useRef<HTMLDivElement>(null);
  const catalogTopRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const isScrollingTo = useRef(false);

  const list = useMemo(() => products.data ?? [], [products.data]);

  const filtered = useMemo(() => {
    const result = query
      ? list.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()))
      : list;
    return [...result].sort((a, b) => {
      const ab = isBoosted(a), bb = isBoosted(b);
      if (ab !== bb) return ab ? -1 : 1;
      return 0;
    });
  }, [list, query]);

  const grouped = useMemo(() => {
    const map = new Map<string, typeof filtered>();
    for (const p of filtered) {
      if (!map.has(p.category)) map.set(p.category, []);
      map.get(p.category)!.push(p);
    }
    return map;
  }, [filtered]);

  const groupedCategories = useMemo(() => Array.from(grouped.keys()), [grouped]);

  // Reset page when query or category changes
  useEffect(() => { setPage(1); }, [query, activeCategory]);

  // Paginated flat list (used when search active or single category)
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginated = useMemo(
    () => filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE),
    [filtered, page]
  );

  // Scroll back to catalog top on page change
  const scrollToCatalogTop = useCallback(() => {
    const el = catalogTopRef.current;
    if (!el) return;
    const top = el.getBoundingClientRect().top + window.scrollY - NAVBAR_H - 8;
    window.scrollTo({ top, behavior: "smooth" });
  }, []);

  function goToPage(p: number) {
    setPage(p);
    scrollToCatalogTop();
  }

  // ── Sticky + active category via scroll ──────────────────────────────────
  useEffect(() => {
    const onScroll = () => {
      const searchBar = searchBarRef.current;
      if (searchBar) {
        setIsSticky(searchBar.getBoundingClientRect().top < NAVBAR_H);
      }
      if (isScrollingTo.current || groupedCategories.length < 2) return;
      const offset = NAVBAR_H + STICKY_BAR_H + 8;
      let current = groupedCategories[0];
      for (const cat of groupedCategories) {
        const el = sectionRefs.current[cat];
        if (el && el.getBoundingClientRect().top <= offset) current = cat;
      }
      setActiveCategory(current);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener("scroll", onScroll);
  }, [groupedCategories]);

  // ── Click category chip → scroll to section ──────────────────────────────
  const handleCategoryClick = useCallback((cat: string) => {
    setActiveCategory(cat);
    if (!cat) {
      searchBarRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    isScrollingTo.current = true;
    const el = sectionRefs.current[cat];
    if (el) {
      const top = el.getBoundingClientRect().top + window.scrollY - NAVBAR_H - STICKY_BAR_H - 8;
      window.scrollTo({ top, behavior: "smooth" });
    }
    setTimeout(() => { isScrollingTo.current = false; }, 900);
  }, []);

  const showGrouped = !query && groupedCategories.length > 1;

  return (
    <>
      {/* Fixed sticky category bar */}
      {isSticky && groupedCategories.length > 1 && (
        <div className="fixed top-16 left-0 right-0 z-30 border-b border-slate-200 bg-white/95 px-4 py-2 shadow-sm backdrop-blur-sm">
          <div className="mx-auto max-w-[1600px]">
            <CategoryChips categories={groupedCategories} value={activeCategory} onChange={handleCategoryClick} />
          </div>
        </div>
      )}

      {/* Catalog top anchor */}
      <div ref={catalogTopRef} />

      {/* Search + inline category chips */}
      <div ref={searchBarRef} className="sticky top-16 z-20 space-y-3 bg-slate-50/90 py-2 backdrop-blur-sm">
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search this shop…"
            className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
          />
        </div>
        {groupedCategories.length > 1 && (
          <CategoryChips categories={groupedCategories} value={activeCategory} onChange={handleCategoryClick} />
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
        ) : showGrouped ? (
          /* ── Grouped by category (no pagination — sections act as navigation) ── */
          <div className="space-y-10">
            {groupedCategories.map((cat) => (
              <div key={cat} ref={(el) => { sectionRefs.current[cat] = el; }}>
                <h2 className="mb-4 border-b border-slate-100 pb-2 text-base font-semibold text-slate-700">
                  {cat}
                  <span className="ml-2 text-xs font-normal text-slate-400">
                    ({grouped.get(cat)!.length})
                  </span>
                </h2>
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
                  {grouped.get(cat)!.map((p, i) => (
                    <ProductCard key={p.id} product={p} store={store} index={i} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* ── Flat paginated grid (search active or single category) ── */
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {paginated.map((p, i) => (
                <ProductCard key={p.id} product={p} store={store} index={i} />
              ))}
            </div>

            {totalPages > 1 && (
              <Pagination page={page} totalPages={totalPages} onChange={goToPage} />
            )}
          </>
        )}
      </div>
    </>
  );
}

/* ── Pagination bar ─────────────────────────────────────────────────────── */
function Pagination({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  const pages = useMemo(() => {
    const arr: (number | "…")[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (i === 1 || i === totalPages || (i >= page - 1 && i <= page + 1)) {
        arr.push(i);
      } else if (arr[arr.length - 1] !== "…") {
        arr.push("…");
      }
    }
    return arr;
  }, [page, totalPages]);

  return (
    <div className="mt-8 flex items-center justify-center gap-1.5">
      <button
        onClick={() => onChange(page - 1)}
        disabled={page === 1}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronLeft className="h-4 w-4" />
      </button>

      {pages.map((p, i) =>
        p === "…" ? (
          <span key={`ellipsis-${i}`} className="px-1 text-slate-400">…</span>
        ) : (
          <button
            key={p}
            onClick={() => onChange(p as number)}
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
        onClick={() => onChange(page + 1)}
        disabled={page === totalPages}
        className="flex h-9 w-9 items-center justify-center rounded-lg border border-slate-200 text-slate-500 transition hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed"
      >
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}
