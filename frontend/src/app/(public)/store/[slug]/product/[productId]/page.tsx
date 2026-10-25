"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, Eye, MessageCircle, PlayCircle, ShoppingCart, Store as StoreIcon, Zap } from "lucide-react";
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

          <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-slate-500">
            {product.rating && product.rating.count > 0 && (
              <span className="flex items-center gap-1.5">
                <StarRating value={product.rating.average} size={15} />
                {product.rating.average.toFixed(1)} ({product.rating.count})
              </span>
            )}
            {/* The API only includes view counts for the product's seller and admins. */}
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
            <span className="text-3xl font-bold text-slate-900">
              {formatPrice(effectivePrice(product))}
            </span>
            {discount && (
              <>
                <span className="text-lg text-slate-400 line-through">
                  {formatPrice(product.price)}
                </span>
                <Badge tone="red">{discount}% OFF</Badge>
              </>
            )}
          </div>

          {product.description && (
            <p className="mt-4 text-sm leading-relaxed text-slate-600">
              {product.description}
            </p>
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
              />
            </div>
          )}
        </div>
      </div>

      <ProductReviews productId={product.id} />

      <RelatedProducts productId={product.id} category={product.category} />

      <MoreFromStore currentProductId={product.id} store={store} />

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
function RelatedProducts({ productId, category }: { productId: string; category: string }) {
  const { data: related, isLoading } = useGetRelatedProductsQuery(productId);

  if (isLoading) {
    return (
      <div className="mt-12">
        <Skeleton className="mb-4 h-6 w-48" />
        <div className={PRODUCT_GRID}>
          {Array.from({ length: 6 }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }
  if (!related || related.length === 0) return null;

  return (
    <section className="mt-12">
      <SectionHeader
        title={
          <>
            Related products in <span className="text-brand-700">{category}</span>
          </>
        }
        href={`/search?category=${encodeURIComponent(category)}`}
      />
      <div className={PRODUCT_GRID}>
        {related.map((p, i) => (
          <ProductCard key={p.id} product={p} store={p.store} index={i} />
        ))}
      </div>
    </section>
  );
}

/** Other products from the shop the customer is browsing. */
function MoreFromStore({ currentProductId, store }: { currentProductId: string; store: Store }) {
  const { data: allProducts } = useGetStoreProductsQuery({ storeId: store.id, publicOnly: true });

  const others = (allProducts ?? []).filter((p) => p.id !== currentProductId);
  if (others.length === 0) return null;

  return (
    <section className="mt-12">
      <SectionHeader
        title={
          <>
            More from <span className="text-brand-700">{store.name}</span>
          </>
        }
        href={others.length > 6 ? `/store/${store.slug}/products` : undefined}
      />
      <div className={PRODUCT_GRID}>
        {others.slice(0, 6).map((p, i) => (
          <ProductCard key={p.id} product={p} store={store} index={i} />
        ))}
      </div>
    </section>
  );
}
