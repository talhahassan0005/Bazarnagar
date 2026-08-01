"use client";

import { useMemo } from "react";
import { useGetActiveBannersQuery } from "@/store/apiSlice";
import type { Banner, Store } from "@/lib/types";

/** Shared: fetch active banners for a store (skipped unless on the free plan). */
function useActiveBanner(store: Store): Banner | null {
  const isStarter = store.planId === "starter";
  const { data: banners } = useGetActiveBannersQuery(store.category, { skip: !isStarter });

  // Pick one banner at random when multiple are active — stable per mount.
  return useMemo(() => {
    if (!isStarter || !banners || banners.length === 0) return null;
    return banners[Math.floor(Math.random() * banners.length)]!;
  }, [isStarter, banners]);
}

/**
 * Horizontal banner ad shown on the shop page for free (starter) plan
 * stores. Sourced from admin-managed banners (`/admin/banners`); if none are
 * configured yet, falls back to a generic "discover more shops" placeholder.
 */
export function ShopBanner({ store }: { store: Store }) {
  const banner = useActiveBanner(store);
  if (store.planId !== "starter") return null;

  if (!banner) {
    return (
      <div className="w-full rounded-2xl border border-amber-200 bg-gradient-to-r from-amber-50 to-orange-50 px-4 py-3 text-center text-sm text-amber-800">
        <span className="font-medium">Sponsored</span>
        {" · "}
        Discover more shops on{" "}
        <a href="/shops" className="font-semibold underline hover:text-amber-900">
          Bazaarnagar
        </a>
      </div>
    );
  }

  const image = (
    <img
      src={banner.imageUrl}
      alt={banner.title || "Sponsored"}
      className="block max-h-40 w-full rounded-2xl object-cover"
    />
  );

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/60">
      <span className="absolute left-2 top-2 z-10 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
        Sponsored
      </span>
      {banner.linkUrl ? (
        <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer">
          {image}
        </a>
      ) : (
        image
      )}
    </div>
  );
}

/**
 * Vertical (sidebar) banner ad — same banner pool as `ShopBanner`, shown as
 * a tall card next to the product grid on free (starter) plan shop pages.
 */
export function ShopBannerVertical({ store }: { store: Store }) {
  const banner = useActiveBanner(store);
  if (store.planId !== "starter") return null;

  if (!banner) {
    return (
      <div className="flex h-full min-h-[280px] w-full flex-col items-center justify-center rounded-2xl border border-amber-200 bg-gradient-to-b from-amber-50 to-orange-50 p-4 text-center text-sm text-amber-800">
        <span className="font-medium">Sponsored</span>
        <p className="mt-2">
          Discover more shops on{" "}
          <a href="/shops" className="font-semibold underline hover:text-amber-900">
            Bazaarnagar
          </a>
        </p>
      </div>
    );
  }

  const image = (
    <img
      src={banner.imageUrl}
      alt={banner.title || "Sponsored"}
      className="block w-full rounded-2xl object-contain"
    />
  );

  return (
    <div className="relative w-full overflow-hidden rounded-2xl border border-amber-200 bg-amber-50/60 p-2">
      <span className="absolute left-3 top-3 z-10 rounded bg-black/60 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white">
        Sponsored
      </span>
      {banner.linkUrl ? (
        <a href={banner.linkUrl} target="_blank" rel="noopener noreferrer">
          {image}
        </a>
      ) : (
        image
      )}
    </div>
  );
}
