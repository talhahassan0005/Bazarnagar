import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  Check,
  MapPin,
  MessageCircle,
  Package,
  Search,
  Store,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui";
import { SITE_NAME } from "@/lib/constants";

export const metadata: Metadata = {
  title: `About · ${SITE_NAME}`,
  description:
    "Bazaar Nagar is a free online marketplace built for Pakistan's shopkeepers. Create your store in minutes, list up to 50 products free.",
};

const WHAT_WE_DO = [
  { icon: Store, text: "Create a free store with your shop's name, profile, and location" },
  { icon: Package, text: "List up to 50 products or services free — with images, prices, and categories" },
  { icon: Search, text: "Get discovered through search and category browsing" },
  { icon: MessageCircle, text: "Talk to customers directly on WhatsApp — no middleman, no commission" },
  { icon: MapPin, text: "Show your location on the map so nearby customers can find and visit you" },
];

const WHY = [
  {
    title: "It's genuinely free.",
    desc: "Your store and your first 50 products cost nothing. We believe every shopkeeper deserves an online presence, regardless of budget.",
  },
  {
    title: "It's simple.",
    desc: "If you can use WhatsApp, you can run a Bazaar Nagar store. No technical skills needed.",
  },
  {
    title: "It's local.",
    desc: "Built in Pakistan, for Pakistani businesses. Your customers search in their own neighborhoods, and your store shows up.",
  },
  {
    title: "It's yours.",
    desc: "You control your products, your prices, and your customer relationships. Customers contact you directly.",
  },
];

const WHO = [
  "Shopkeepers who want customers to find them online",
  "Home-based businesses ready for their first storefront",
  "Service providers — tailors, electricians, tutors, salons — who want to be discoverable",
  "Anyone starting out who can't afford website builders or marketplace commissions",
];

const FAQS = [
  { q: "Is Bazaar Nagar really free?", a: "Yes. Creating a store and listing up to 50 products is completely free." },
  { q: "How many products can I list for free?", a: "Up to 50 products or services per store, free." },
  { q: "Do I need a computer?", a: "No — everything works from your phone." },
  { q: "How do customers contact me?", a: "Directly through WhatsApp, using the button on your store page." },
  { q: "How do I get started?", a: "Register your shop, add your details, upload your products, and your store goes live after a quick approval." },
];

export default function AboutPage() {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">

      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-brand-800 to-brand-950 px-8 py-16 text-white mt-8 sm:py-20">
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-accent-500/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-brand-400/20 blur-3xl" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-xs font-medium text-brand-100 ring-1 ring-white/20">
            🇵🇰 Made for Pakistan
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            About {SITE_NAME}
          </h1>
          <p className="mt-3 text-xl font-medium text-brand-200">
            Your store. Online. Free.
          </p>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-brand-100">
            Bazaar Nagar is a free online marketplace built for Pakistan's shopkeepers and service
            providers. Create your own online store in minutes and list up to 50 products at no
            cost — no setup fees, no monthly charges, no hidden costs.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button href="/signup" variant="accent" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Create your free store
            </Button>
            <Button href="/search" size="lg" className="border-white/20 bg-white/10 text-white hover:bg-white/20">
              Browse shops
            </Button>
          </div>
        </div>
      </section>

      {/* What we do */}
      <section className="py-16">
        <div className="grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">What we do</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              Every neighborhood has great shops.<br />
              <span className="text-brand-600">We put them online.</span>
            </h2>
            <p className="mt-4 text-slate-500 leading-relaxed">
              Whether you sell clothes, electronics, groceries, or offer services like tailoring or
              repairs — Bazaar Nagar gives you a real online presence in minutes.
            </p>
          </div>
          <div className="space-y-3">
            {WHAT_WE_DO.map((item) => (
              <div
                key={item.text}
                className="flex items-start gap-4 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                  <item.icon className="h-4 w-4" />
                </div>
                <p className="text-sm leading-relaxed text-slate-600">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Bazaar Nagar */}
      <section className="border-t border-slate-100 py-16">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Why Bazaar Nagar?</p>
          <h2 className="mt-2 text-3xl font-bold text-slate-900">Built different. For you.</h2>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2">
          {WHY.map((item, i) => (
            <div
              key={item.title}
              className="relative overflow-hidden rounded-2xl border border-slate-100 bg-white p-6 shadow-sm"
            >
              <span className="absolute right-4 top-4 text-5xl font-black text-slate-50 select-none">
                {i + 1}
              </span>
              <h3 className="text-base font-bold text-brand-900">{item.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-500">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Who is it for */}
      <section className="border-t border-slate-100 py-16">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Who is it for?</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">
              If you have something to sell,<br />this is for you.
            </h2>
            <p className="mt-4 text-slate-500 leading-relaxed">
              From a small corner shop to a home-based business — Bazaar Nagar is built for
              everyone who deserves to be found online.
            </p>
          </div>
          <ul className="space-y-3">
            {WHO.map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-brand-100 text-brand-700 mt-0.5">
                  <Check className="h-3.5 w-3.5" />
                </span>
                <span className="text-slate-600">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-100 py-16">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">FAQ</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Frequently asked questions</h2>
          </div>
          <div className="mt-10 space-y-3">
            {FAQS.map((faq) => (
              <div key={faq.q} className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm">
                <p className="font-semibold text-slate-900">{faq.q}</p>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="pb-16">
        <div className="relative overflow-hidden rounded-3xl bg-brand-800 px-8 py-12 text-center text-white">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent-500/30 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <p className="relative text-sm font-medium text-brand-200 italic">
            Bazaar Nagar — every shop deserves to be found.
          </p>
          <h2 className="relative mt-2 text-2xl font-bold">Ready to open your store?</h2>
          <p className="relative mx-auto mt-2 max-w-md text-brand-100">
            Free to start. No credit card. Live in minutes.
          </p>
          <div className="relative mt-6 flex justify-center">
            <Link
              href="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-medium text-brand-800 transition-transform duration-200 hover:scale-[1.03] active:scale-[0.98]"
            >
              Create your free store <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

    </div>
  );
}
