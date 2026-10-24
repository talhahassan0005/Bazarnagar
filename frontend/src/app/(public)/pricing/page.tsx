import type { Metadata } from "next";
import { PricingPlans } from "@/components/marketing/PricingPlans";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Pricing · ${SITE_NAME}`,
  description: `Start your online store on ${SITE_NAME} for free, and upgrade when you need more products. No sales commission.`,
};

const FAQS = [
  { q: "Is the free plan really free?", a: "Yes. Your store and products on the free plan cost nothing — no setup fee, no monthly fee, no commission on sales." },
  { q: "Can I change plans later?", a: "Yes. Upgrade any time from Plan & Billing in your seller dashboard. Your store and products stay as they are." },
  { q: "How do I pay for a paid plan?", a: "From your dashboard, by card or by bank transfer / Easypaisa / JazzCash. Plans are billed monthly." },
  { q: "Do you take a cut of my sales?", a: "No. Customers pay you directly — you keep every rupee." },
];

export default function PricingPage() {
  return (
    <div className="relative overflow-hidden">
      <div className="pointer-events-none absolute -top-32 left-1/2 h-96 w-[48rem] -translate-x-1/2 rounded-full bg-brand-100/60 blur-3xl" />

      <div className="relative mx-auto w-full max-w-[1600px] px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <span className="inline-flex rounded-full bg-accent-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.14em] text-accent-700">
            Pricing
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-brand-900 sm:text-5xl">
            Start free. Grow when you&apos;re ready.
          </h1>
          <p className="mt-4 text-base leading-relaxed text-slate-600 sm:text-lg">
            Open your online store at no cost, and upgrade only when you need more. 0% commission on every plan.
          </p>
        </div>

        <div className="mt-12">
          <PricingPlans />
        </div>

        <div className="mx-auto mt-20 max-w-3xl">
          <h2 className="text-center text-2xl font-bold text-brand-900">Questions</h2>
          <div className="mt-6 divide-y divide-slate-200 rounded-2xl border border-slate-200 bg-white">
            {FAQS.map((f) => (
              <details key={f.q} className="group px-5 py-4">
                <summary className="cursor-pointer list-none font-medium text-slate-800 marker:hidden">
                  <span className="flex items-center justify-between gap-3">
                    {f.q}
                    <span className="text-slate-400 transition-transform group-open:rotate-45">+</span>
                  </span>
                </summary>
                <p className="mt-2 text-sm leading-relaxed text-slate-600">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
