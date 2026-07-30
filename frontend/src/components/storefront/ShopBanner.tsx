"use client";

import { useMemo } from "react";
import { useGetActiveBannersQuery } from "@/store/apiSlice";
import type { Store } from "@/lib/types";

/**
 * Banner ad shown on the shop page for free (starter) plan stores.
 * Sourced from admin-managed banners (`/admin/banners`); if none are
 * configured yet, falls back to a generic "discover more shops" placeholder.
 */
export function ShopBanner({ store }: { store: Store }) {
  const isStarter = store.planId === "starter";
  const { data: banners } = useGetActiveBannersQuery(undefined, { skip: !isStarter });

  // Pick one banner at random when multiple are active — stable per mount.
  const banner = useMemo(() => {
    if (!banners || banners.length === 0) return null;
    return banners[Math.floor(Math.random() * banners.length)];
  }, [banners]);

  if (!isStarter) return null;

  if (!banner) {
    return (
      <div className="w-full bg-gradient-to-r from-amber-50 to-orange-50 border-y border-amber-200 py-3 px-4 text-center text-sm text-amber-800">
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
      className="block max-h-40 w-full object-cover"
    />
  );

  return (
    <div className="relative w-full border-y border-amber-200 bg-amber-50/60">
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
