import type { ReactNode } from "react";
import { LEGAL_UPDATED, SITE_EMAIL, SITE_NAME } from "@/lib/constants";
import { FileText, Mail, Shield } from "lucide-react";

/**
 * Shared wrapper for legal pages (Terms, Privacy).
 * Attractive layout with hero header, styled sections, and sticky sidebar TOC.
 */
export function LegalPage({
  title,
  intro,
  children,
  icon = "shield",
}: {
  title: string;
  intro: string;
  children: ReactNode;
  icon?: "shield" | "file";
}) {
  const Icon = icon === "file" ? FileText : Shield;

  return (
    <div>
      {/* Hero header */}
      <div className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-br from-brand-50 via-white to-slate-50">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-brand-100/40 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-40 w-40 rounded-full bg-accent-100/30 blur-2xl" />
        <div className="relative mx-auto w-full max-w-4xl px-4 py-14 sm:px-6 lg:px-8">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-brand-600 text-white shadow-lg shadow-brand-600/30">
              <Icon className="h-6 w-6" />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">
                Legal
              </p>
              <h1 className="text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">
                {title}
              </h1>
            </div>
          </div>
          <p className="mt-5 max-w-2xl text-base leading-relaxed text-slate-600">{intro}</p>
          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-slate-400">
            <span className="flex items-center gap-1.5">
              <span className="inline-block h-1.5 w-1.5 rounded-full bg-green-400" />
              Last updated: {LEGAL_UPDATED}
            </span>
            <span>·</span>
            <a
              href={`mailto:${SITE_EMAIL}`}
              className="flex items-center gap-1 text-brand-600 hover:underline"
            >
              <Mail className="h-3 w-3" /> {SITE_EMAIL}
            </a>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="mx-auto w-full max-w-4xl px-4 py-12 sm:px-6 lg:px-8">
        <div
          className={[
            "space-y-2 text-[15px] leading-relaxed text-slate-600",

            // Section headings — styled as cards
            "[&_h2]:mt-10 [&_h2]:flex [&_h2]:items-center [&_h2]:gap-2",
            "[&_h2]:rounded-xl [&_h2]:border [&_h2]:border-brand-100 [&_h2]:bg-brand-50/60",
            "[&_h2]:px-4 [&_h2]:py-3 [&_h2]:text-base [&_h2]:font-semibold [&_h2]:text-brand-900",
            "[&_h2]:scroll-mt-24",
            "[&_h2]:before:content-['§'] [&_h2]:before:text-brand-300 [&_h2]:before:font-normal [&_h2]:before:mr-1",

            // Paragraphs
            "[&_p]:mt-3 [&_p]:text-slate-600",

            // Lists
            "[&_ul]:mt-3 [&_ul]:space-y-2.5 [&_ul]:pl-0",
            "[&_ul_li]:flex [&_ul_li]:items-start [&_ul_li]:gap-2.5",
            "[&_ul_li]:before:content-['→'] [&_ul_li]:before:text-brand-400 [&_ul_li]:before:shrink-0 [&_ul_li]:before:mt-0.5 [&_ul_li]:before:text-sm",

            // Inline strong
            "[&_strong]:font-semibold [&_strong]:text-slate-800",

            // Links
            "[&_a]:font-medium [&_a]:text-brand-700 [&_a:hover]:underline",
          ].join(" ")}
        >
          {children}
        </div>

        {/* Footer CTA */}
        <div className="mt-14 rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50 to-slate-50 p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-slate-900">Have a question?</p>
              <p className="mt-0.5 text-sm text-slate-500">
                Our team is happy to help with any questions about this policy.
              </p>
            </div>
            <a
              href={`mailto:${SITE_EMAIL}`}
              className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-brand-600 px-5 py-2.5 text-sm font-medium text-white shadow-sm transition-all hover:bg-brand-700 hover:shadow-md"
            >
              <Mail className="h-4 w-4" />
              Contact us
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
