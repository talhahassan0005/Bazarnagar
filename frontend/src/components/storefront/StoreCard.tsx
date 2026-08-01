import Link from "next/link";
import { MapPin, Navigation } from "lucide-react";
import { Badge } from "@/components/ui";
import { formatDistance } from "@/lib/utils";
import type { Store } from "@/lib/types";

/** Compact shop card for the shops directory (/shops). */
export function StoreCard({ store, distanceKm }: { store: Store; distanceKm?: number }) {
  const location = [store.area, store.city].filter(Boolean).join(", ");

  return (
    <Link
      href={`/store/${store.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-brand-200 hover:shadow-lg hover:shadow-brand-900/5"
    >
      {/* Cover */}
      <div className="relative h-24 bg-gradient-to-r from-brand-100 to-brand-50">
        {store.coverUrl && (
          <img src={store.coverUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="flex flex-1 flex-col px-4 pb-4">
        {/* Logo sits below the cover with clear space — no overlap */}
        <span className="mt-3 flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl border-2 border-slate-100 bg-brand-600 text-2xl font-bold uppercase text-white shadow-sm">
          {store.logoUrl ? (
            <img src={store.logoUrl} alt={store.name} className="h-full w-full object-cover" />
          ) : (
            store.name.charAt(0)
          )}
        </span>

        <h3 className="mt-2 font-semibold text-slate-900 group-hover:text-brand-700">
          {store.name}
        </h3>
        <div className="mt-1 flex flex-wrap items-center gap-2">
          <Badge tone="brand">{store.category}</Badge>
          <Badge tone={store.isOpen === false ? "red" : "green"}>
            {store.isOpen === false ? "Closed" : "Open"}
          </Badge>
          {store.showLocation && location && (
            <span className="flex items-center gap-1 text-xs text-slate-500">
              <MapPin className="h-3 w-3" />
              {location}
            </span>
          )}
          {typeof distanceKm === "number" && (
            <span className="flex items-center gap-1 text-xs font-medium text-brand-700">
              <Navigation className="h-3 w-3" />
              {formatDistance(distanceKm)} away
            </span>
          )}
        </div>
        <p className="clamp-2 mt-2 text-sm text-slate-500">{store.description}</p>
      </div>
    </Link>
  );
}
