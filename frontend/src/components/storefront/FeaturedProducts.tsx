import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ProductCard } from "@/components/domain/ProductCard";
import { STORE_THEMES, type ResolvedLanding } from "@/lib/landing";
import { cn } from "@/lib/utils";
import type { Product, Store } from "@/lib/types";

/**
 * Curated products showcased on the landing page. Renders nothing when the
 * seller hasn't picked any featured products.
 */
export function FeaturedProducts({
  store,
  landing,
  products,
}: {
  store: Store;
  landing: ResolvedLanding;
  products: Product[];
}) {
  if (products.length === 0) return null;
  const theme = STORE_THEMES[landing.theme];

  return (
    <section className="mx-auto w-full max-w-[1600px] px-4 py-14 sm:px-6 lg:px-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className={cn("text-xs font-semibold uppercase tracking-wide", theme.accentText)}>
            Featured
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">Handpicked for you</h2>
        </div>
        <Link
          href={`/store/${store.slug}/products`}
          className={cn(
            "inline-flex items-center gap-1 text-sm font-medium hover:underline",
            theme.accentText
          )}
        >
          View all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} store={store} />
        ))}
      </div>
    </section>
  );
}
