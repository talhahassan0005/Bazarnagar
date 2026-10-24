import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Clock,
  Headphones,
  HelpCircle,
  Mail,
  MessageCircle,
  PackageSearch,
  Phone,
  Store,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui";
import { CopyEmailButton } from "@/components/domain/CopyEmailButton";
import { PaymentHelpBox } from "@/components/domain/PaymentHelpBox";
import { SITE_EMAIL, SITE_NAME, SITE_PHONE, SITE_PHONE_DISPLAY } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Contact us · ${SITE_NAME}`,
  description: `Get in touch with the ${SITE_NAME} team on WhatsApp at ${SITE_PHONE_DISPLAY} or by email at ${SITE_EMAIL}.`,
};

// Opens Gmail's compose window in the browser — works even when the visitor
// has no desktop email app set up for mailto: links.
const GMAIL_COMPOSE = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(SITE_EMAIL)}`;

const HELP_LINKS = [
  {
    icon: Store,
    title: "Start selling",
    text: "Open your free shop and add your first products in minutes.",
    href: "/signup?role=seller",
    tone: "bg-accent-50 text-accent-600",
  },
  {
    icon: PackageSearch,
    title: "Track an order",
    text: "See the status of orders you've placed on Bazaarnagar.",
    href: "/orders",
    tone: "bg-leaf-500/10 text-leaf-600",
  },
  {
    icon: HelpCircle,
    title: "How it works & FAQs",
    text: "Quick answers about stores, orders, plans and boosting.",
    href: "/how-it-works",
    tone: "bg-brand-50 text-brand-700",
  },
];

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
        {/* Payment help — only when arriving from a payment screen (?topic=payment) */}
        <Suspense>
          <PaymentHelpBox />
        </Suspense>

        {/* Contact options */}
        <div className="grid gap-5 md:grid-cols-2">
          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-whatsapp/10" />
            <span className="inline-flex items-center gap-1 rounded-full bg-whatsapp/10 px-2.5 py-0.5 text-xs font-semibold text-green-700">
              <Zap className="h-3 w-3" /> Fastest
            </span>
            <span className="mt-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-whatsapp text-white shadow-lg shadow-whatsapp/30">
              <MessageCircle className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">WhatsApp or call</h2>
            <a
              href={`tel:+${SITE_PHONE}`}
              className="mt-1 block text-2xl font-bold tracking-tight text-slate-900 hover:underline"
            >
              {SITE_PHONE_DISPLAY}
            </a>
            <p className="mt-2 text-sm text-slate-500">Best for quick questions about your store or an order.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                href={`https://wa.me/${SITE_PHONE}`}
                target="_blank"
                variant="whatsapp"
                leftIcon={<MessageCircle className="h-4 w-4" />}
              >
                Chat on WhatsApp
              </Button>
              <Button href={`tel:+${SITE_PHONE}`} variant="outline" leftIcon={<Phone className="h-4 w-4" />}>
                Call now
              </Button>
            </div>
          </div>

          <div className="relative overflow-hidden rounded-3xl border border-slate-200 bg-white p-6 shadow-sm transition-shadow hover:shadow-md sm:p-8">
            <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-brand-100/60" />
            <span className="inline-flex items-center gap-1 rounded-full bg-brand-50 px-2.5 py-0.5 text-xs font-semibold text-brand-700">
              <Mail className="h-3 w-3" /> Detailed questions
            </span>
            <span className="mt-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-brand-600 to-brand-800 text-white shadow-lg shadow-brand-900/25">
              <Mail className="h-6 w-6" />
            </span>
            <h2 className="mt-4 text-lg font-semibold text-slate-900">Email us</h2>
            <p className="mt-1 break-all text-2xl font-bold tracking-tight text-slate-900">{SITE_EMAIL}</p>
            <p className="mt-2 text-sm text-slate-500">Best for account, payment or partnership questions.</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button href={GMAIL_COMPOSE} target="_blank" leftIcon={<Mail className="h-4 w-4" />}>
                Write in Gmail
              </Button>
              <CopyEmailButton email={SITE_EMAIL} />
            </div>
            <a
              href={`mailto:${SITE_EMAIL}`}
              className="mt-3 inline-block text-xs text-slate-400 underline-offset-2 hover:text-brand-700 hover:underline"
            >
              Or open your email app
            </a>
          </div>
        </div>

        {/* Quick help */}
        <h2 className="mt-14 text-center text-2xl font-bold text-slate-900">How can we help?</h2>
        <p className="mt-2 text-center text-slate-500">You might find your answer even faster here.</p>
        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          {HELP_LINKS.map(({ icon: Icon, title, text, href, tone }) => (
            <Link
              key={title}
              href={href}
              className="group rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-brand-200 hover:shadow-md"
            >
              <span className={`flex h-10 w-10 items-center justify-center rounded-xl ${tone}`}>
                <Icon className="h-5 w-5" />
              </span>
              <p className="mt-3 flex items-center gap-1 font-semibold text-slate-900">
                {title}
                <ArrowRight className="h-4 w-4 opacity-0 transition-all duration-200 group-hover:translate-x-0.5 group-hover:opacity-100" />
              </p>
              <p className="mt-1 text-sm text-slate-500">{text}</p>
            </Link>
          ))}
        </div>

        {/* CTA */}
        <div className="relative mt-14 overflow-hidden rounded-3xl bg-brand-800 px-8 py-10 text-center text-white">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent-500/30 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <h2 className="relative text-2xl font-bold">Ready to open your shop?</h2>
          <p className="relative mx-auto mt-2 max-w-md text-white/80">
            It&apos;s free, takes a few minutes, and needs no website or app.
          </p>
          <Link
            href="/signup?role=seller"
            className="relative mt-6 inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-medium text-brand-800 transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
          >
            Create your free store <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </>
  );
}
