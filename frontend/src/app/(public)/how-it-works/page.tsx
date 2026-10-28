import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  ChevronDown,
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
import { Button } from "@/components/ui";
import { PricingPlans } from "@/components/marketing/PricingPlans";
import { PLAN_LIST, PLANS, SITE_DOMAIN, SITE_EMAIL, SITE_NAME } from "@/lib/constants";
import { API_BASE } from "@/lib/api";
import type { Plan } from "@/lib/types";

async function fetchPlans(): Promise<Plan[]> {
  try {
    const res = await fetch(`${API_BASE}/public/plans`, { next: { revalidate: 300 } });
    if (!res.ok) return PLAN_LIST;
    return res.json();
  } catch {
    return PLAN_LIST;
  }
}

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
    desc: "Your products appear in Bazarnagar's search by name, category and city — customers find you without needing your link.",
  },
  {
    icon: ImagePlus,
    title: "Product gallery",
    desc: `Upload up to ${PLANS.starter.imageLimit} photos per product on the Free plan, or up to ${PLANS.basic.imageLimit} on paid plans.`,
  },
  {
    icon: Star,
    title: "Featured / Boosted products",
    desc: "Any seller — Free plan included — can boost a product for a small daily fee, for as many days as they like. Boosted products appear first in search results and your shop catalog with a ★ Featured badge.",
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

const FAQ_SECTIONS = [
  {
    title: "Creating your free store",
    faqs: [
      {
        q: "How do I create a free store?",
        a: "1) Click \"Start selling\" and sign up with your name, phone number, email and a password. 2) In your dashboard, open Store Profile and fill in your shop name, a short description, category, WhatsApp number and city — then save. 3) Go to Products → Add product to list your first item. That's it — your shop is live with its own link.",
      },
      {
        q: "Is the store really free? Does the free plan expire?",
        a: "Yes, it's really free. The Free plan never expires and needs no card or payment — you can list up to 50 products with 4 photos each. You only pay if you choose to upgrade for more products.",
      },
      {
        q: "What do I need to get started?",
        a: "Just an email address, a WhatsApp number for customers to reach you, and a few photos of what you sell. No documents, website or technical skills are needed.",
      },
      {
        q: "How long does it take to set up?",
        a: "Most sellers have their shop and first products online in about 10 minutes. You can always come back later to add your logo, cover photo, map location and social links.",
      },
      {
        q: "What is my store link?",
        a: `Your shop gets its own link based on its name, like ${SITE_DOMAIN}/store/your-shop-name. Share it on WhatsApp, Facebook and Instagram so customers can browse your products.`,
      },
      {
        q: "How do I add products?",
        a: "Go to Dashboard → Products → Add product. Enter a name, category and price, upload photos, and add a description if you like. New products go through a quick review and then appear in your shop and in search.",
      },
      {
        q: "Can I make my shop look like my own website?",
        a: "Yes. Under Dashboard → Landing Page you can turn on a custom shop homepage with your own headline, hero image, colour theme, featured products and an About section.",
      },
      {
        q: "Do I need a website or technical skills?",
        a: "No. Everything is done through a simple dashboard. If you can use WhatsApp, you can run a shop on Bazarnagar.",
      },
    ],
  },
  {
    title: "Selling & orders",
    faqs: [
      {
        q: "How do customers place orders?",
        a: "Customers can tap the WhatsApp button on any product to message you with the product name, price and link, or place an order through checkout. You confirm and arrange delivery directly.",
      },
      {
        q: "How do customers pay?",
        a: "Orders placed on Bazarnagar are Cash on Delivery — the customer pays when the order arrives. For WhatsApp orders, you agree on payment directly with the customer.",
      },
      {
        q: "What is product moderation?",
        a: "When you add or edit a product, it goes through a quick review to make sure it meets our guidelines. Approved products go live publicly. If something needs a fix, you'll see the reason in your dashboard.",
      },
      {
        q: "Can I have more than one shop?",
        a: "Each seller account has one shop. If you need multiple shops, create separate seller accounts.",
      },
    ],
  },
  {
    title: "Plans & upgrades",
    faqs: [
      {
        q: "What do paid plans add?",
        a: "Paid plans (Plan 1, 2 and 3) unlock more products — up to 100, 200 or 500 — with up to 8 images per product.",
      },
      {
        q: "What are Boosted / Featured products?",
        a: "Boosting promotes a specific product for a daily fee — you choose how many days. Boosted products sort first in search results and your shop catalog, and show a ★ Featured badge. Every seller can boost, including on the Free plan: go to Dashboard → Products and tap the rocket icon. The boost starts as soon as you submit your payment.",
      },
      {
        q: "How do I change my plan?",
        a: "Go to Dashboard → Plan. You can upgrade or downgrade at any time. A paid plan takes effect immediately and runs on a 30-day billing cycle.",
      },
      {
        q: "What happens if my paid plan expires?",
        a: "There is a 7-day grace period after a paid plan expires. If you don't renew within that window, your shop is hidden from public search until you renew or switch back to the Free plan.",
      },
    ],
  },
  {
    title: "Support",
    faqs: [
      {
        q: "How do I contact support?",
        a: `Email us at ${SITE_EMAIL}. We typically respond within 24 hours.`,
      },
    ],
  },
];

// FAQ structured data so search engines can show these answers directly.
const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_SECTIONS.flatMap((s) =>
    s.faqs.map((f) => ({
      "@type": "Question",
      name: f.q,
      acceptedAnswer: { "@type": "Answer", text: f.a },
    }))
  ),
};

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

export default async function HowItWorksPage() {
  const plans = await fetchPlans();
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
          <Button href="/signup?role=seller" variant="accent" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
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
        <div className="mt-10">
          <PricingPlans serverPlans={plans} />
        </div>
      </section>

      {/* FAQ */}
      <section className="border-t border-slate-100 py-16">
        <div className="mx-auto max-w-2xl">
          <div className="text-center">
            <p className="text-xs font-semibold uppercase tracking-widest text-brand-600">FAQ</p>
            <h2 className="mt-2 text-2xl font-bold text-slate-900">Frequently asked questions</h2>
          </div>
          {FAQ_SECTIONS.map((section) => (
            <div key={section.title} className="mt-10">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-slate-400">
                {section.title}
              </h3>
              <div className="mt-2">
                {section.faqs.map((faq) => (
                  <FaqItem key={faq.q} q={faq.q} a={faq.a} />
                ))}
              </div>
            </div>
          ))}
          <p className="mt-8 text-center text-sm text-slate-500">
            Still have questions?{" "}
            <Link href="/contact" className="font-medium text-brand-700 hover:underline">
              Contact us
            </Link>
          </p>
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={{ __html: JSON.stringify(FAQ_JSON_LD) }}
          />
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
              href="/signup?role=seller"
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
