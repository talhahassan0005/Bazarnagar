"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import { StoreHeader } from "@/components/domain/StoreHeader";
import { StoreCatalog } from "@/components/storefront/StoreCatalog";
import { StoreLandingHero } from "@/components/storefront/StoreLandingHero";
import { FeaturedProducts } from "@/components/storefront/FeaturedProducts";
import { StoreAbout } from "@/components/storefront/StoreAbout";
import { StoreContact } from "@/components/storefront/StoreContact";
import { useGetStoreBySlugQuery, useGetStoreProductsQuery } from "@/store/apiSlice";
import { resolveLanding } from "@/lib/landing";

export default function PublicStorePage() {
  const { slug } = useParams<{ slug: string }>();
  const store = useGetStoreBySlugQuery(slug);

  const landing = store.data ? resolveLanding(store.data) : null;

  // Featured products are only needed when the landing page is enabled.
  const products = useGetStoreProductsQuery(
    { storeId: store.data?.id ?? "", publicOnly: true },
    { skip: !store.data || !landing?.enabled || !landing.showFeatured }
  );

  const featured = useMemo(() => {
    if (!landing?.featuredProductIds.length || !products.data) return [];
    const byId = new Map(products.data.map((p) => [p.id, p]));
    return landing.featuredProductIds
      .map((id) => byId.get(id))
      .filter((p): p is NonNullable<typeof p> => Boolean(p));
  }, [landing, products.data]);

  if (store.isLoading) {
    return (
      <div>
        <Skeleton className="h-72 rounded-none sm:h-96" />
        <div className="mx-auto w-full max-w-[1600px] space-y-4 px-4 py-12 sm:px-6 lg:px-8">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-full max-w-md" />
        </div>
      </div>
    );
  }

  if (!store.data || !landing) {
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

  // Landing disabled → show the catalog directly on the store URL.
  if (!landing.enabled) {
    return (
      <div className="mx-auto w-full max-w-[1600px] px-4 py-6 sm:px-6 lg:px-8">
        <StoreHeader store={store.data} />
        <div className="mt-6">
          <StoreCatalog store={store.data} />
        </div>
      </div>
    );
  }

  return (
    <>
      <StoreLandingHero store={store.data} landing={landing} />
      {landing.showFeatured && (
        <FeaturedProducts store={store.data} landing={landing} products={featured} />
      )}
      {landing.showAbout && <StoreAbout landing={landing} />}
      {landing.showContact && <StoreContact store={store.data} landing={landing} />}
    </>
  );
}
