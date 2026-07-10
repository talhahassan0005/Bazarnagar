"use client";

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/domain/ProductCard";
import { ProductGridSkeleton } from "@/components/ui";
import { useSearchProductsQuery } from "@/store/apiSlice";

/**
 * Live product feed on the homepage (Daraz-style). Pulls public products from
 * the search endpoint — featured/boosted products already come first.
 */
export function HomeProducts() {
  const { data, isLoading } = useSearchProductsQuery({});
  const products = (data ?? []).slice(0, 12);

  // Nothing to show yet (empty catalog) → hide the section entirely.
  if (!isLoading && products.length === 0) return null;

  return (
    <section className="mx-auto w-full max-w-[1600px] px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-2xl font-bold text-brand-900">Popular products</h2>
          <p className="mt-1 text-sm text-slate-500">Fresh picks from shops across Pakistan.</p>
        </div>
        <Link
          href="/search"
          className="inline-flex items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
        >
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-6">
        {isLoading ? (
          <ProductGridSkeleton />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} store={p.store} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
