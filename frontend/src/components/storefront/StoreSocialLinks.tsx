"use client";

import { useTrackSocialClickMutation } from "@/store/apiSlice";
import { storeSocials } from "@/lib/socials";
import { cn } from "@/lib/utils";
import type { Store } from "@/lib/types";

/**
 * Round clickable icons for the shop's social links. Each tap is counted
 * (with its date) for the seller's and admin's social click reports.
 */
export function StoreSocialLinks({ store, className }: { store: Pick<Store, "id" | "socials">; className?: string }) {
  const [trackClick] = useTrackSocialClickMutation();
  const links = storeSocials(store.socials);
  if (links.length === 0) return null;

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {links.map(({ key, label, icon: Icon, href, className: color }) => (
        <a
          key={key}
          href={href}
          target="_blank"
          rel="noopener noreferrer nofollow"
          title={label}
          aria-label={label}
          className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow"
          onClick={() => {
            // Fire-and-forget: never block opening the link on the count.
            trackClick({ storeId: store.id, platform: key }).catch(() => {});
          }}
        >
          <Icon className={cn("h-4 w-4", color)} />
        </a>
      ))}
    </div>
  );
}
