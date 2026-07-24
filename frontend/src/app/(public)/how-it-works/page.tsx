import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
  CreditCard,
  ImagePlus,
  Link2,
  MessageCircle,
  Package,
  Search,
  ShieldCheck,
  Smartphone,
  Star,
  Store,
  UserPlus,
  Zap,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { PLANS, SITE_EMAIL, SITE_NAME } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

export const metadata: Metadata = {
  title: `How It Works · ${SITE_NAME}`,
  description: `Learn how to create your shop, list products, and start selling on ${SITE_NAME} in minutes.`,
};

const ACCOUNT_STEPS = [
  {
    icon: UserPlus,
    step: "1",
    title: "Sign up for free",
    desc: "Go to bazaarnagar.com/signup. Enter your name, email, phone number and a password. No credit card needed.",
    tone: "bg-brand-50 text-brand-700",
  },
  {
    icon: Store,
    step: "2",
    title: "Create your shop profile",
    desc: "Add your shop name, category, city, WhatsApp number, logo and cover photo. Your public link is generated instantly.",
    tone: "bg-accent-50 text-accent-600",
  },
  {
    icon: Package,
    step: "3",
    title: "Add your products",
    desc: "Upload product photos, set a price, add a description and pick a category. Products go live after a quick moderation check.",
    tone: "bg-emerald-50 text-emerald-700",
  },
  {
    icon: Link2,
    step: "4",
    title: "Share your shop link",
    desc: "Copy your link (bazaarnagar.com/store/your-shop) and share it on WhatsApp, Instagram bio, Facebook or anywhere.",
    tone: "bg-amber-50 text-amber-700",
  },
  {
    icon: MessageCircle,
    step: "5",
    title: "Receive orders on WhatsApp",
    desc: "Customers browse your shop and tap the WhatsApp button. Their inquiry — with product name, price and link — lands straight in your chat.",
    tone: "bg-green-50 text-green-700",
  },
];

const FEATURES = [
  {
    icon: Search,
    title: "Public search",
    desc: "Your products appear in Bazaarnagar's search by name, category and city — customers find you without needing your link.",
  },
  {
    icon: ImagePlus,
    title: "Product gallery",
    desc: "Upload multiple photos per product (depending on your plan). Paid plans also support product videos.",
  },
  {
    icon: Star,
    title: "Featured / Boosted products",
    desc: "Pay to boost a product for 7, 15 or 30 days. Boosted products appear first in search results and your shop catalog with a ★ Featured badge.",
  },
  {
    icon: Smartphone,
    title: "Mobile-first design",
    desc: "Your shop looks great on any phone. Customers don't need to install anything — it works in any browser.",
  },
  {
    icon: ShieldCheck,
    title: "Moderation & safety",
    desc: "Every product is reviewed before going public. This keeps the marketplace trustworthy for buyers.",
  },
  {
    icon: Zap,
    title: "Custom landing page",
    desc: "Pick a colour theme, set a hero image, headline, featured products, about section and contact block — all from your dashboard.",
  },
];

const FAQS = [
  {
    q: "Is Bazaarnagar free to use?",
    a: "Yes. The Starter plan is free and lets you list up to 5 products with 1 image each. Paid plans (Basic, Growth, Pro) unlock unlimited products, more images, videos and advanced features.",
  },
  {
    q: "Do I need a website or technical skills?",
    a: "No. Everything is done through a simple dashboard. If you can use WhatsApp, you can run a shop on Bazaarnagar.",
  },
  {
    q: "How do customers place orders?",
    a: "Customers browse your shop and tap the WhatsApp button on any product. A pre-filled message with the product name, price and link is sent to your WhatsApp number. You confirm and arrange delivery directly.",
  },
  {
    q: "Can customers also pay online?",
    a: "Yes. Customers can place orders with Cash on Delivery or pay online via card. Online payments are deposited to your connected payout account (Easypaisa, JazzCash or bank).",
  },
  {
    q: "What is product moderation?",
    a: "When you add or edit a product, it goes through a quick review to make sure it meets our guidelines. Approved products go live publicly. If something needs a fix, you'll see the reason in your dashboard.",
  },
  {
    q: "What are Boosted / Featured products?",
    a: "Boosting pays to promote a specific product for 7, 15 or 30 days. Boosted products sort first in search results and your shop catalog, and show a ★ Featured badge. Available on Basic, Growth and Pro plans.",
  },
  {
    q: "Why do I see ads on my shop page?",
    a: "Shops on the free Starter plan show a small Bazaarnagar banner ad. Upgrading to any paid plan removes the banner permanently.",
  },
  {
    q: "Can I have more than one shop?",
    a: "Each seller account has one shop. If you need multiple shops, create separate seller accounts.",
  },
  {
    q: "How do I change my plan?",
    a: "Go to Dashboard → Plan. You can upgrade or downgrade at any time. The new plan takes effect immediately and starts a fresh 30-day billing cycle.",
  },
  {
    q: "What happens if my subscription expires?",
    a: "There is a 7-day grace period after expiry. If you don't renew within that window, your shop is hidden from public search until you reactivate.",
  },
  {
    q: "How do I connect my payout account?",
    a: "Go to Dashboard → Settings → Payout. Enter your Easypaisa, JazzCash or bank account details. Once saved, online order payments will be deposited there.",
  },
  {
    q: "How do I contact support?",
    a: `Email us at ${SITE_EMAIL}. We typically respond within 24 hours.`,
  },
];

function FaqItem({ q, a }: { q: string; a: string }) {
  return (
    <details className="group border-b border-slate-200 py-5 last:border-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base font-medium text-slate-900 marker:hidden [&::-webkit-details-marker]:hidden">
        {q}
        <ChevronDown className="h-5 w-5 shrink-0 text-slate-400 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <p className="mt-3 text-sm leading-relaxed text-slate-500">{a}</p>
    </details>
  );
}

export default function HowItWorksPage() {
  return (
    <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">

      {/* Hero */}
      <section className="py-16 text-center">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand-50 px-3 py-1 text-xs font-medium text-brand-700 ring-1 ring-brand-100">
          <BadgeCheck className="h-3.5 w-3.5" /> Simple. Fast. Free to start.
        </span>
        <h1 className="mt-4 text-4xl font-bold tracking-tight text-brand-900 sm:text-5xl">
          How {SITE_NAME} works
        </h1>
        <p className="mx-auto mt-4 max-w-xl text-lg text-slate-500">
          Turn your WhatsApp or Instagram shop into a proper online store — with a public link,
          product catalog and orders — in under 10 minutes.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Button href="/signup" variant="accent" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
            Create your free store
          </Button>
          <Button href="/search" size="lg" variant="outline">
            Browse shops
          </Button>
        </div>
      </section>

      {/* Account creation steps */}
      <section className="border-t border-slate-100 py-16">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Getting started</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">How to create your account & shop</h2>
          <p className="mt-2 text-slate-500">Five steps from sign-up to your first sale.</p>
        </div>

        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          {ACCOUNT_STEPS.map((s) => (
            <Card
              key={s.step}
              className="relative p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-900/5"
            >
              <span className="absolute right-4 top-4 text-4xl font-black text-slate-100 select-none">
                {s.step}
              </span>
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.tone}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 text-sm font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1.5 text-sm leading-relaxed text-slate-500">{s.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-slate-100 py-16">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">What you get</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Everything your shop needs</h2>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="flex gap-4 rounded-2xl border border-slate-100 bg-white p-5 shadow-sm"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                <f.icon className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-semibold text-slate-900">{f.title}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Plans */}
      <section className="border-t border-slate-100 py-16">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">Pricing</p>
          <h2 className="mt-2 text-2xl font-bold text-slate-900">Simple, affordable plans</h2>
          <p className="mt-2 text-slate-500">Start free. Upgrade as your shop grows.</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {(["starter", "basic", "growth", "pro"] as const).map((id) => {
            const plan = PLANS[id];
            const popular = id === "growth";
            return (
              <Card
                key={id}
                className={
                  popular
                    ? "relative border-accent-300 p-6 ring-1 ring-accent-200 transition-transform duration-300 hover:-translate-y-1"
                    : "p-6 transition-transform duration-300 hover:-translate-y-1"
                }
              >
                {popular && (
                  <span className="absolute -top-3 left-6 rounded-full bg-accent-500 px-3 py-0.5 text-xs font-medium text-white shadow-sm">
                    Popular
                  </span>
                )}
                <h3 className="text-lg font-semibold text-slate-900">{plan.name}</h3>
                <p className="mt-2">
                  <span className="text-3xl font-bold text-brand-900">{formatPrice(plan.price)}</span>
                  <span className="text-sm text-slate-400">/mo</span>
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {(plan.highlights ?? []).map((h) => (
                    <li key={h} className="flex items-start gap-2">
                      <BadgeCheck className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                      {h}
                    </li>
                  ))}
                  {id === "starter" && (
                    <li className="flex items-start gap-2 text-amber-600">
                      <CreditCard className="mt-0.5 h-4 w-4 shrink-0" />
                      Banner ads shown on shop
                    </li>
                  )}
                  {id !== "starter" && (
                    <li className="flex items-start gap-2 text-brand-700">
                      <Star className="mt-0.5 h-4 w-4 shrink-0" />
                      Boost / feature products
                    </li>
                  )}
                </ul>
                <Button
                  href="/signup"
                  variant={popular ? "accent" : "outline"}
                  fullWidth
                  className="mt-6"
                >
                  {id === "starter" ? "Start free" : `Choose ${plan.name}`}
                </Button>
              </Card>
            );
          })}
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-100 py-16">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">FAQ</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Frequently asked questions</h2>
          </div>
          <div className="mt-10">
            {FAQS.map((faq) => (
              <FaqItem key={faq.q} q={faq.q} a={faq.a} />
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-slate-500">
            Still have questions?{" "}
            <a href={`mailto:${SITE_EMAIL}`} className="font-medium text-brand-700 hover:underline">
              Email us
            </a>
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="pb-20">
        <div className="relative overflow-hidden rounded-3xl bg-brand-800 px-8 py-12 text-center text-white">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent-500/30 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
          <h2 className="relative text-2xl font-bold">Ready to open your shop?</h2>
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
