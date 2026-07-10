"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/domain/ProductCard";
import { ProductGridSkeleton } from "@/components/ui";
import { useSearchProductsQuery } from "@/store/apiSlice";
import { CATEGORIES } from "@/lib/constants";
import { cn } from "@/lib/utils";

const chip = (active: boolean) =>
  cn(
    "rounded-full border px-4 py-2 text-sm font-medium transition-colors",
    active
      ? "border-brand-600 bg-brand-600 text-white"
      : "border-slate-200 bg-white text-slate-600 hover:border-brand-300 hover:bg-brand-50 hover:text-brand-700"
  );

/**
 * Homepage catalog — category chips FILTER the product grid in place (no
 * redirect). Featured/boosted products come first (backend ordering).
 */
export function HomeCatalog() {
  const [category, setCategory] = useState("");
  const { data, isLoading } = useSearchProductsQuery({ category });
  const products = (data ?? []).slice(0, 18);

  return (
    <>
      {/* Category filter bar */}
      <section className="border-y border-slate-200 bg-white">
        <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-bold text-brand-900">Shop by category</h2>
            <Link href="/search" className="text-sm font-medium text-brand-700 hover:underline">
              Advanced search →
            </Link>
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
        </div>
      </section>

      {/* Filtered products */}
      <section className="mx-auto w-full max-w-[1600px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-3">
          <div>
            <h2 className="text-2xl font-bold text-brand-900">
              {category ? `${category}` : "Popular products"}
            </h2>
            <p className="mt-1 text-sm text-slate-500">
              {category
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
          ) : products.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-slate-200 py-12 text-center text-sm text-slate-400">
              No products in {category || "this catalog"} yet.
            </p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {products.map((p) => (
                <ProductCard key={p.id} product={p} store={p.store} />
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
