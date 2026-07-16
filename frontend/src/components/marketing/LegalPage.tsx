import type { ReactNode } from "react";
import { LEGAL_UPDATED } from "@/lib/constants";

/**
 * Shared wrapper for legal pages (Terms, Privacy). Applies consistent
 * typography to the plain HTML passed as children.
 */
export function LegalPage({ title, intro, children }: { title: string; intro: string; children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <p className="text-sm font-medium text-brand-600">Legal</p>
      <h1 className="mt-1 text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
        {title}
      </h1>
      <p className="mt-3 text-slate-600">{intro}</p>
      <p className="mt-2 text-xs text-slate-400">Last updated: {LEGAL_UPDATED}</p>

      <div
        className={[
          "mt-8 space-y-6 text-[15px] leading-relaxed text-slate-600",
          "[&_h2]:mt-8 [&_h2]:text-lg [&_h2]:font-semibold [&_h2]:text-slate-900",
          "[&_h2]:scroll-mt-24",
          "[&_p]:mt-3",
          "[&_ul]:mt-3 [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5",
          "[&_a]:font-medium [&_a]:text-brand-700 [&_a:hover]:underline",
          "[&_strong]:font-semibold [&_strong]:text-slate-800",
        ].join(" ")}
      >
        {children}
      </div>
    </div>
  );
}
