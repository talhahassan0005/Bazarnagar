import {
  AtSign,
  Globe,
  MapPin,
  MessageCircle,
  Navigation,
  Truck,
  Wallet,
} from "lucide-react";
import { Badge, Button } from "@/components/ui";
import { toWhatsAppNumber } from "@/lib/utils";
import type { Store } from "@/lib/types";

/** Public shop page header (SRS §7.1). */
export function StoreHeader({ store }: { store: Store }) {
  const location = [store.area, store.city].filter(Boolean).join(", ");

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm">
      {/* Cover */}
      <div className="relative h-36 bg-gradient-to-r from-brand-100 to-brand-50 sm:h-48">
        {store.coverUrl && (
          <img src={store.coverUrl} alt="" className="h-full w-full object-cover" />
        )}
      </div>

      <div className="px-4 pb-5 sm:px-6">
        <div className="-mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex items-end gap-4">
            <span className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-brand-600 text-2xl font-bold text-white shadow">
              {store.logoUrl ? (
                <img src={store.logoUrl} alt={store.name} className="h-full w-full object-cover" />
              ) : (
                store.name.charAt(0)
              )}
            </span>
            <div className="pb-1">
              <h1 className="text-xl font-bold text-slate-900 sm:text-2xl">{store.name}</h1>
              <div className="mt-1 flex flex-wrap items-center gap-2">
                <Badge tone="brand">{store.category}</Badge>
                {store.showLocation && location && (
                  <span className="flex items-center gap-1 text-sm text-slate-500">
                    <MapPin className="h-3.5 w-3.5" />
                    {location}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex gap-2">
            {store.showLocation && store.mapsLink && (
              <Button
                href={store.mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
                leftIcon={<Navigation className="h-4 w-4" />}
              >
                Directions
              </Button>
            )}
            <Button
              href={`https://wa.me/${toWhatsAppNumber(store.whatsapp)}`}
              target="_blank"
              rel="noopener noreferrer"
              variant="whatsapp"
              leftIcon={<MessageCircle className="h-4 w-4" />}
            >
              WhatsApp
            </Button>
          </div>
        </div>

        <p className="mt-4 max-w-2xl text-sm text-slate-600">{store.description}</p>

        {/* Info chips */}
        <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">
          {store.deliveryInfo && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1">
              <Truck className="h-3.5 w-3.5" /> {store.deliveryInfo}
            </span>
          )}
          {store.paymentInfo && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1">
              <Wallet className="h-3.5 w-3.5" /> {store.paymentInfo}
            </span>
          )}
          {store.socials?.instagram && (
            <a
              href={`https://instagram.com/${store.socials.instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 hover:bg-slate-200"
            >
              <AtSign className="h-3.5 w-3.5" /> Instagram
            </a>
          )}
          {store.socials?.facebook && (
            <a
              href={`https://facebook.com/${store.socials.facebook}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 hover:bg-slate-200"
            >
              <Globe className="h-3.5 w-3.5" /> Facebook
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
