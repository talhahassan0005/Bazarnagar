import Link from "next/link";
import { ArrowRight, MapPin, MessageCircle } from "lucide-react";
import { STORE_THEMES, type ResolvedLanding } from "@/lib/landing";
import { cn, toWhatsAppNumber } from "@/lib/utils";
import type { Store } from "@/lib/types";

/** Themed hero for a store's customizable landing page. */
export function StoreLandingHero({
  store,
  landing,
}: {
  store: Store;
  landing: ResolvedLanding;
}) {
  const theme = STORE_THEMES[landing.theme];
  const location = [store.area, store.city].filter(Boolean).join(", ");

  return (
    <section className="relative overflow-hidden">
      {/* Cover image */}
      {landing.heroImageUrl && (
        <img
          src={landing.heroImageUrl}
          alt=""
          aria-hidden
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
      {/* Theme gradient overlay (full colour when there is no image) */}
      <div
        aria-hidden
        className={cn(
          "absolute inset-0 bg-gradient-to-br",
          theme.heroFrom,
          theme.heroTo,
          landing.heroImageUrl && "opacity-90"
        )}
      />

      <div className="relative mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
        <div className="flex items-center gap-4">
          <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-white/80 bg-white text-2xl font-bold text-slate-700 shadow-lg">
            {store.logoUrl ? (
              <img src={store.logoUrl} alt={store.name} className="h-full w-full object-cover" />
            ) : (
              store.name.charAt(0)
            )}
          </span>
          <div className="text-white/90">
            <span className="inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-medium backdrop-blur">
              {store.category}
            </span>
            {store.showLocation && location && (
              <span className="mt-1 flex items-center gap-1 text-sm">
                <MapPin className="h-3.5 w-3.5" /> {location}
              </span>
            )}
          </div>
        </div>

        <div className="max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight text-white drop-shadow-sm sm:text-5xl">
            {landing.headline}
          </h1>
          <p className="mt-4 text-lg text-white/90">{landing.tagline}</p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href={`/store/${store.slug}/products`}
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-white px-6 text-base font-medium text-slate-900 shadow-sm transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
          >
            {landing.primaryCtaLabel}
            <ArrowRight className="h-4 w-4" />
          </Link>
          <a
            href={`https://wa.me/${toWhatsAppNumber(store.whatsapp)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-12 items-center justify-center gap-2 rounded-xl border border-white/40 bg-white/10 px-6 text-base font-medium text-white backdrop-blur transition-colors hover:bg-white/20"
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </a>
        </div>
      </div>
    </section>
  );
}
