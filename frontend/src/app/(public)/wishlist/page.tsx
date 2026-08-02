"use client";

import { Heart } from "lucide-react";
import { EmptyState, Skeleton, Button } from "@/components/ui";
import { ProductCard } from "@/components/domain/ProductCard";
import { useAppSelector } from "@/store/hooks";
import { useGetWishlistQuery } from "@/store/apiSlice";

export default function WishlistPage() {
  const role = useAppSelector((s) => s.auth.role);
  const authReady = useAppSelector((s) => s.auth.ready);
  const isCustomer = role === "customer";

  const { data: products, isFetching } = useGetWishlistQuery(undefined, { skip: !isCustomer });

  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-brand-900">My wishlist</h1>
      <p className="mt-1 text-sm text-slate-500">Products you've saved for later.</p>

      <div className="mt-6">
        {!authReady || (isCustomer && isFetching) ? (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        ) : !isCustomer ? (
          <EmptyState
            icon={<Heart className="h-6 w-6" />}
            title="Log in to see your wishlist"
            description="Save products while you browse and find them here later."
            action={<Button href="/account/login">Log in</Button>}
          />
        ) : !products || products.length === 0 ? (
          <EmptyState
            icon={<Heart className="h-6 w-6" />}
            title="No saved products yet"
            description="Tap the heart on any product to save it here."
            action={<Button href="/search">Browse products</Button>}
          />
        ) : (
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} store={p.store} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
