"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { Button, EmptyState, ProductGridSkeleton, Skeleton } from "@/components/ui";
import { StoreHeader } from "@/components/domain/StoreHeader";
import { StoreCatalog } from "@/components/storefront/StoreCatalog";
import { useGetStoreBySlugQuery } from "@/store/apiSlice";

/** Full product catalog for a store. The landing page lives at /store/[slug]. */
export default function StoreCatalogPage() {
  const { slug } = useParams<{ slug: string }>();
  const store = useGetStoreBySlugQuery(slug);

  if (store.isLoading) {
    return (
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <Skeleton className="h-36 rounded-none sm:h-48" />
          <div className="space-y-3 px-4 pb-5 pt-3 sm:px-6">
            <Skeleton className="-mt-14 h-20 w-20 rounded-2xl" />
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full max-w-md" />
          </div>
        </div>
        <div className="mt-6">
          <ProductGridSkeleton />
        </div>
      </div>
    );
  }

  if (!store.data) {
    return (
      <div className="mx-auto w-full max-w-[1600px] px-4 py-16 sm:px-6 lg:px-8">
        <EmptyState
          title="Shop not found"
          description="This store link may be incorrect or the shop is no longer available."
          action={<Button href="/search">Browse other shops</Button>}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
      <Link
        href={`/store/${store.data.slug}`}
        className="mb-4 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-brand-700"
      >
        <ChevronLeft className="h-4 w-4" /> Back to {store.data.name}
      </Link>

      <StoreHeader store={store.data} />

      <div className="mt-6">
        <StoreCatalog store={store.data} />
      </div>
    </div>
  );
}
