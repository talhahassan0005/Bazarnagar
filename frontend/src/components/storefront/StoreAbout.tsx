import { STORE_THEMES, type ResolvedLanding } from "@/lib/landing";
import { cn } from "@/lib/utils";

/** "About this store" section on the landing page. */
export function StoreAbout({ landing }: { landing: ResolvedLanding }) {
  const theme = STORE_THEMES[landing.theme];

  return (
    <section className={cn("py-14", theme.soft)}>
      <div className="mx-auto w-full max-w-3xl px-4 text-center sm:px-6 lg:px-8">
        <p className={cn("text-xs font-semibold uppercase tracking-wide", theme.accentText)}>
          About
        </p>
        <h2 className="mt-1 text-2xl font-bold text-slate-900">{landing.aboutTitle}</h2>
        <p className="mt-4 whitespace-pre-line text-base leading-relaxed text-slate-600">
          {landing.aboutText}
        </p>
      </div>
    </section>
  );
}
