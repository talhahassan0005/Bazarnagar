import { Suspense } from "react";
import type { Metadata } from "next";
import { Clock, Headphones } from "lucide-react";
import { PaymentHelpBox } from "@/components/domain/PaymentHelpBox";
import { ContactTabs } from "@/components/domain/ContactTabs";
import { SITE_EMAIL, SITE_NAME, SITE_PHONE_DISPLAY } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Contact us · ${SITE_NAME}`,
  description: `Get in touch with the ${SITE_NAME} team on WhatsApp at ${SITE_PHONE_DISPLAY} or by email at ${SITE_EMAIL}.`,
};

export default function ContactPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-brand-50 via-white to-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-brand-200/30 blur-3xl" />
        <div className="relative mx-auto w-full max-w-5xl px-4 py-12 text-center sm:px-6 sm:py-16">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-700 shadow-sm ring-1 ring-brand-100">
            <Headphones className="h-3.5 w-3.5 text-accent-500" />
            We&apos;re here to help
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-brand-900 sm:text-5xl">
            Get in <span className="text-accent-500">touch</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
            Questions about selling, your store or an order? Message us — real people at{" "}
            {SITE_NAME} will help you out.
          </p>
          <p className="mt-4 inline-flex items-center gap-1.5 text-sm text-slate-500">
            <Clock className="h-4 w-4 text-leaf-500" /> We typically reply within 24 hours
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <Suspense>
          <PaymentHelpBox />
        </Suspense>

        <ContactTabs />
      </div>
    </>
  );
}
