"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, Eye, MessageCircle, PlayCircle, ShieldCheck, ShoppingCart, Store as StoreIcon, Zap } from "lucide-react";
import type { ReactNode } from "react";
import { Badge, Button, EmptyState, LoadingPanel, ProductCardSkeleton, Skeleton } from "@/components/ui";
import { ImageGallery } from "@/components/domain/ImageGallery";
import { WhatsAppButton } from "@/components/domain/WhatsAppButton";
import { StockBadge, DeliveryBadge } from "@/components/domain/StatusBadges";
import { WishlistButton } from "@/components/domain/WishlistButton";
import { ChatWidget } from "@/components/domain/ChatWidget";
import { StarRating } from "@/components/storefront/StarRating";
import { ProductReviews } from "@/components/storefront/ProductReviews";
import { AddToCartButton, BuyNowButton } from "@/components/storefront/CartButtons";
import { canOrderOnline } from "@/lib/cart";
import { ProductCard } from "@/components/domain/ProductCard";
import { CodNotice } from "@/components/domain/CodNotice";
import { ProductVariantSelector } from "@/components/domain/ProductVariantSelector";
import {
  useGetProductQuery,
  useGetRelatedProductsQuery,
  useGetStoreProductsQuery,
} from "@/store/apiSlice";
import { discountPercent, effectivePrice, formatCount, formatPrice } from "@/lib/utils";
import type { Store } from "@/lib/types";

export default function ProductDetailPage() {
  const { productId } = useParams<{ productId: string }>();
  const { data: product, isLoading } = useGetProductQuery(productId);
  // Must be declared before any early returns (Rules of Hooks)
  const [variantPrice, setVariantPrice] = useState<number | null>(null);
  const [variantLabel, setVariantLabel] = useState<string>("");

  if (isLoading) return <LoadingPanel label="Loading product…" />;

  if (!product) {
    return (
      <div className="mx-auto w-full max-w-[1600px] px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          title="Product not found"
          description="This product may no longer be available."
          action={<Button href="/search">Browse products</Button>}
        />
      </div>
    );
  }

  const { store } = product;
  const discount = discountPercent(product);
  const displayPrice = variantPrice ?? effectivePrice(product);

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <nav className="mb-4 flex items-center gap-1 text-sm text-slate-500">
        <Link href={`/store/${store.slug}`} className="hover:text-brand-700">
          {store.name}
        </Link>
        <ChevronRight className="h-4 w-4" />
        <Link href={`/store/${store.slug}/products`} className="hover:text-brand-700">
          Products
        </Link>
        <ChevronRight className="h-4 w-4" />
        <span className="truncate text-slate-700">{product.name}</span>
      </nav>

      {/* Top: image + purchase panel */}
      <div className="grid gap-8 lg:grid-cols-2">
        <ImageGallery images={product.images} alt={product.name} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{product.category}</Badge>
            <StockBadge status={product.stockStatus} />
            {product.negotiable && <Badge tone="amber">Negotiable</Badge>}
            <DeliveryBadge option={store.noDelivery ? "not_available" : product.deliveryOption} fee={product.deliveryFee} />
            {product.condition && (
              <Badge tone="gray">{product.condition === "new" ? "Brand new" : "Second hand"}</Badge>
            )}
            <WishlistButton productId={product.id} className="ml-auto" />
          </div>

          <h1 className="mt-3 text-2xl font-bold text-slate-900">{product.name}</h1>
          {product.brand && (
            <p className="mt-1 text-sm text-slate-500">
              Brand: <span className="font-medium text-slate-700">{product.brand}</span>
            </p>
          )}

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            {product.rating && product.rating.count > 0 && (
              <span className="flex items-center gap-1.5">
                <StarRating value={product.rating.average} size={15} />
                {product.rating.average.toFixed(1)} ({product.rating.count})
              </span>
            )}
            {product.views != null && (
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" /> {formatCount(product.views)} views
              </span>
            )}
            {product.whatsappClicks != null && (
              <span className="flex items-center gap-1">
                <MessageCircle className="h-4 w-4" /> {formatCount(product.whatsappClicks)} WhatsApp inquiries
              </span>
            )}
            {product.addToCartClicks != null && (
              <span className="flex items-center gap-1">
                <ShoppingCart className="h-4 w-4" /> {formatCount(product.addToCartClicks)} add to cart
              </span>
            )}
            {product.buyNowClicks != null && (
              <span className="flex items-center gap-1">
                <Zap className="h-4 w-4" /> {formatCount(product.buyNowClicks)} buy now
              </span>
            )}
          </div>

          <div className="mt-3 flex items-baseline gap-3">
            <span className="text-3xl font-bold text-slate-900">{formatPrice(displayPrice)}</span>
            {discount && !(product.variants && product.variants.length > 0) && (
              <>
                <span className="text-lg text-slate-400 line-through">{formatPrice(product.price)}</span>
                <Badge tone="red">{discount}% OFF</Badge>
              </>
            )}
          </div>

          {product.variants && product.variants.length > 0 && (
            <ProductVariantSelector
              variants={product.variants}
              onPriceChange={setVariantPrice}
              onVariantChange={setVariantLabel}
            />
          )}

          {product.videoUrl && (
            <a
              href={product.videoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-brand-700 hover:underline"
            >
              <PlayCircle className="h-4 w-4" /> Watch product video
            </a>
          )}

          {/* Store strip */}
          <Link
            href={`/store/${store.slug}`}
            className="mt-6 flex items-center gap-3 rounded-xl border border-slate-200 p-3 transition hover:bg-slate-50"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-700">
              <StoreIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium text-slate-800">{store.name}</p>
              <p className="text-xs text-slate-400">
                {[store.area, store.city].filter(Boolean).join(", ")}
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400" />
          </Link>

          {canOrderOnline(product, store) ? (
            <div className="mt-6 space-y-3">
              <BuyNowButton product={product} store={store} fullWidth />
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                <AddToCartButton product={product} store={store} size="lg" fullWidth />
                <WhatsAppButton
                  product={product}
                  store={store}
                  size="lg"
                  fullWidth
                  label={product.negotiable ? "Negotiate on WhatsApp" : "Inquire on WhatsApp"}
                  variantLabel={variantLabel || undefined}
                  variantPrice={variantPrice}
                />
              </div>
              <CodNotice compact />
            </div>
          ) : (
            <div className="mt-6 space-y-3">
              <p className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                <span className="font-semibold text-slate-800">No delivery.</span> This item can&apos;t be ordered
                online — contact the seller on WhatsApp to buy it or arrange pickup.
              </p>
              <WhatsAppButton
                product={product}
                store={store}
                size="lg"
                fullWidth
                label={product.negotiable ? "Negotiate on WhatsApp" : "Contact seller on WhatsApp"}
                variantLabel={variantLabel || undefined}
                variantPrice={variantPrice}
              />
            </div>
          )}
        </div>
      </div>

      {/* Below: description LEFT + store info RIGHT */}
      <div className="mt-10 grid gap-8 lg:grid-cols-[1fr_320px]">
        {/* Left: full description */}
        <div>
          {product.description && (
            <>
              <h2 className="text-lg font-semibold text-slate-900">Product Description</h2>
              <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-slate-600">
                {product.description}
              </p>
            </>
          )}
          {product.tags.length > 0 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {product.tags.map((t) => (
                <span key={t} className="rounded-full bg-slate-100 px-2.5 py-1 text-xs text-slate-500">
                  #{t}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Right: store card */}
        <div className="rounded-2xl border border-brand-100 bg-brand-50 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Sold by</p>
          <Link href={`/store/${store.slug}`} className="mt-3 flex items-center gap-3 group">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-100 text-brand-700">
              <StoreIcon className="h-5 w-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold text-slate-900 group-hover:text-brand-700">{store.name}</p>
              <p className="text-xs text-slate-500">{[store.area, store.city].filter(Boolean).join(", ")}</p>
            </div>
          </Link>
          <div className="mt-4 space-y-2 text-sm text-slate-600">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 shrink-0 text-leaf-500" />
              Verified seller
            </div>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 shrink-0 text-leaf-500" />
              Responds on WhatsApp
            </div>
          </div>
          <WhatsAppButton
            product={product}
            store={store}
            size="sm"
            fullWidth
            label="Contact Seller"
            variantLabel={variantLabel || undefined}
            variantPrice={variantPrice}
          />
        </div>
      </div>

      <ProductReviews productId={product.id} />

      <RelatedAndMore productId={product.id} category={product.category} store={store} />

      <ChatWidget storeId={store.id} storeName={store.name} productId={product.id} productName={product.name} />
    </div>
  );
}

const PRODUCT_GRID =
  "grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6";

/** Section heading with an optional "View all" link on the right. */
function SectionHeader({ title, href }: { title: ReactNode; href?: string }) {
  return (
    <div className="mb-4 flex items-end justify-between gap-3">
      <h2 className="text-lg font-semibold text-slate-800">{title}</h2>
      {href && (
        <Link
          href={href}
          className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-brand-700 hover:underline"
        >
          View all <ChevronRight className="h-4 w-4" />
        </Link>
      )}
    </div>
  );
}

/** Same-category products from every store on the marketplace. */
/** Shows related products (by category) then more from the same store, with no duplicates. */
function RelatedAndMore({ productId, category, store }: { productId: string; category: string; store: Store }) {
  const { data: related, isLoading: relatedLoading } = useGetRelatedProductsQuery(productId);
  const { data: allProducts } = useGetStoreProductsQuery({ storeId: store.id, publicOnly: true });

  const relatedIds = new Set([productId, ...(related ?? []).map((p) => p.id)]);
  const others = (allProducts ?? []).filter((p) => !relatedIds.has(p.id));

  return (
    <>
      {relatedLoading ? (
        <div className="mt-12">
          <Skeleton className="mb-4 h-6 w-48" />
          <div className={PRODUCT_GRID}>
            {Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}
          </div>
        </div>
      ) : related && related.length > 0 ? (
        <section className="mt-12">
          <SectionHeader
            title={<>Related products in <span className="text-brand-700">{category}</span></>}
            href={`/search?category=${encodeURIComponent(category)}`}
          />
          <div className={PRODUCT_GRID}>
            {related.map((p, i) => <ProductCard key={p.id} product={p} store={p.store} index={i} />)}
          </div>
        </section>
      ) : null}

      {others.length > 0 && (
        <section className="mt-12">
          <SectionHeader
            title={<>More from <span className="text-brand-700">{store.name}</span></>}
            href={others.length > 6 ? `/store/${store.slug}/products` : undefined}
          />
          <div className={PRODUCT_GRID}>
            {others.slice(0, 6).map((p, i) => <ProductCard key={p.id} product={p} store={store} index={i} />)}
          </div>
        </section>
      )}
    </>
  );
}
