import Link from "next/link";
import { Badge } from "@/components/ui";
import { StockBadge } from "./StatusBadges";
import { WhatsAppButton } from "./WhatsAppButton";
import type { Product, Store } from "@/lib/types";
import { discountPercent, effectivePrice, formatPrice } from "@/lib/utils";

/** Customer-facing product card (SRS §7.2). */
export function ProductCard({
  product,
  store,
}: {
  product: Product;
  store: Store;
}) {
  const href = `/store/${store.slug}/product/${product.id}`;
  const discount = discountPercent(product);

  return (
    <div className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-900/5">
      <Link href={href} className="relative block aspect-square overflow-hidden bg-slate-100">
        <img
          src={product.images[0]}
          alt={product.name}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
        <div className="absolute left-2 top-2 flex flex-col gap-1">
          {discount && <Badge tone="red">{discount}% OFF</Badge>}
          {product.negotiable && <Badge tone="brand">Negotiable</Badge>}
        </div>
        {product.stockStatus === "out_of_stock" && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/60">
            <span className="rounded-full bg-slate-900/80 px-3 py-1 text-xs font-medium text-white">
              Out of stock
            </span>
          </div>
        )}
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <Link href={href}>
          <h3 className="clamp-2 text-sm font-medium text-slate-800 group-hover:text-brand-700">
            {product.name}
          </h3>
        </Link>

        <div className="mt-1.5 flex items-baseline gap-2">
          <span className="text-base font-semibold text-slate-900">
            {formatPrice(effectivePrice(product))}
          </span>
          {discount && (
            <span className="text-xs text-slate-400 line-through">
              {formatPrice(product.price)}
            </span>
          )}
        </div>

        <div className="mt-2">
          <StockBadge status={product.stockStatus} />
        </div>

        <div className="mt-auto pt-3">
          <WhatsAppButton
            product={product}
            store={store}
            size="sm"
            fullWidth
            label="WhatsApp"
          />
        </div>
      </div>
    </div>
  );
}

/** Responsive grid wrapper for product cards. */
export function ProductGrid({
  products,
  stores,
}: {
  products: Product[];
  stores: Record<string, Store>;
}) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
      {products.map((p) => (
        <ProductCard key={p.id} product={p} store={stores[p.storeId]} />
      ))}
    </div>
  );
}
