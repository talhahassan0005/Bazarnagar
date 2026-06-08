"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronRight, PlayCircle, Store as StoreIcon } from "lucide-react";
import { Badge, Button, EmptyState, LoadingPanel } from "@/components/ui";
import { ImageGallery } from "@/components/domain/ImageGallery";
import { WhatsAppButton } from "@/components/domain/WhatsAppButton";
import { StockBadge } from "@/components/domain/StatusBadges";
import { useGetProductQuery } from "@/store/apiSlice";
import { discountPercent, effectivePrice, formatPrice } from "@/lib/utils";

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
        <span className="truncate text-slate-700">{product.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <ImageGallery images={product.images} alt={product.name} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone="brand">{product.category}</Badge>
            <StockBadge status={product.stockStatus} />
            {product.negotiable && <Badge tone="amber">Negotiable</Badge>}
            {product.condition && (
              <Badge tone="gray" className="capitalize">
                {product.condition}
              </Badge>
            )}
          </div>

          <h1 className="mt-3 text-2xl font-bold text-slate-900">{product.name}</h1>

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

          <div className="mt-6">
            <WhatsAppButton
              product={product}
              store={store}
              size="lg"
              fullWidth
              label={product.negotiable ? "Inquire & negotiate on WhatsApp" : "Inquire on WhatsApp"}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
