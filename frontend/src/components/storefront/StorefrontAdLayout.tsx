"use client";

import type { ReactNode } from "react";
import { ShopBanner, ShopBannerVertical } from "./ShopBanner";
import type { Store } from "@/lib/types";

/**
 * Shared banner-ad placement for storefront pages: a full-width banner
 * above the content, a matching full-width banner below it, and (desktop
 * only) a sticky vertical banner beside the content. Both the full catalog
 * (StoreCatalog) and the landing page's featured section (FeaturedProducts)
 * use this — ad placement and sizing only need to be maintained here, once.
 */
export function StorefrontAdLayout({ store, children }: { store: Store; children: ReactNode }) {
  return (
    <>
      <div className="mb-6">
        <ShopBanner store={store} placement="top" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0">{children}</div>
        <aside className="hidden lg:block">
          <div className="sticky top-20">
            <ShopBannerVertical store={store} />
          </div>
        </aside>
      </div>

      <div className="mt-10">
        <ShopBanner store={store} placement="bottom" />
      </div>
    </>
  );
}
