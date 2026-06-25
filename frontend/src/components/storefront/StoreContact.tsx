import {
  AtSign,
  Globe,
  MapPin,
  MessageCircle,
  Navigation,
  Truck,
  Wallet,
} from "lucide-react";
import { Button } from "@/components/ui";
import { STORE_THEMES, type ResolvedLanding } from "@/lib/landing";
import { cn, toWhatsAppNumber } from "@/lib/utils";
import type { Store } from "@/lib/types";

/** Contact / location / socials block for the landing page. */
export function StoreContact({
  store,
  landing,
}: {
  store: Store;
  landing: ResolvedLanding;
}) {
  const theme = STORE_THEMES[landing.theme];
  const location = [store.area, store.city].filter(Boolean).join(", ");

  return (
    <section className="mx-auto w-full max-w-[1600px] px-4 py-14 sm:px-6 lg:px-8">
      <div className="grid gap-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8 lg:grid-cols-2">
        <div>
          <p className={cn("text-xs font-semibold uppercase tracking-wide", theme.accentText)}>
            Get in touch
          </p>
          <h2 className="mt-1 text-2xl font-bold text-slate-900">
            Order or ask a question
          </h2>
          <p className="mt-2 text-sm text-slate-600">
            Tap below to message {store.name} directly on WhatsApp — no signup needed.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Button
              href={`https://wa.me/${toWhatsAppNumber(store.whatsapp)}`}
              target="_blank"
              rel="noopener noreferrer"
              variant="whatsapp"
              size="lg"
              leftIcon={<MessageCircle className="h-4 w-4" />}
            >
              Message on WhatsApp
            </Button>
            {store.showLocation && store.mapsLink && (
              <Button
                href={store.mapsLink}
                target="_blank"
                rel="noopener noreferrer"
                variant="outline"
                size="lg"
                leftIcon={<Navigation className="h-4 w-4" />}
              >
                Directions
              </Button>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-3 text-sm text-slate-600">
          {store.showLocation && location && (
            <div className="flex items-center gap-2">
              <MapPin className={cn("h-4 w-4", theme.accentText)} />
              {store.fullAddress || location}
            </div>
          )}
          {store.deliveryInfo && (
            <div className="flex items-center gap-2">
              <Truck className={cn("h-4 w-4", theme.accentText)} />
              {store.deliveryInfo}
            </div>
          )}
          {store.paymentInfo && (
            <div className="flex items-center gap-2">
              <Wallet className={cn("h-4 w-4", theme.accentText)} />
              {store.paymentInfo}
            </div>
          )}
          {(store.socials?.instagram || store.socials?.facebook) && (
            <div className="mt-1 flex flex-wrap gap-2">
              {store.socials?.instagram && (
                <a
                  href={`https://instagram.com/${store.socials.instagram}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs hover:bg-slate-200"
                >
                  <AtSign className="h-3.5 w-3.5" /> Instagram
                </a>
              )}
              {store.socials?.facebook && (
                <a
                  href={`https://facebook.com/${store.socials.facebook}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-full bg-slate-100 px-3 py-1 text-xs hover:bg-slate-200"
                >
                  <Globe className="h-3.5 w-3.5" /> Facebook
                </a>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
