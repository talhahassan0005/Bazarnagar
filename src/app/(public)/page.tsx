import Link from "next/link";
import {
  ArrowRight,
  Check,
  Link2,
  MessageCircle,
  Package,
  Search,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { Button, Card } from "@/components/ui";
import { HeroPreview } from "@/components/marketing/HeroPreview";
import { PLAN_LIST, SITE_TAGLINE_UR } from "@/lib/constants";
import { formatPrice } from "@/lib/utils";

const TRUST = ["No setup fees", "Ready in minutes", "Works on any phone", "Cancel anytime"];

const STEPS = [
  { icon: Package, title: "Add your products", text: "Upload photos, prices and details in minutes.", tone: "bg-brand-50 text-brand-700" },
  { icon: Link2, title: "Get a public link", text: "Share bazaarnagar.com/store/your-shop anywhere.", tone: "bg-accent-50 text-accent-600" },
  { icon: MessageCircle, title: "Sell on WhatsApp", text: "Customers tap to inquire and order directly.", tone: "bg-leaf-500/10 text-leaf-600" },
];

const FEATURES = [
  { icon: Search, title: "Found online", text: "Your products appear in public search by name, category & city." },
  { icon: ShieldCheck, title: "Safe & moderated", text: "Every product passes a basic moderation check before going public." },
  { icon: MessageCircle, title: "No app needed", text: "Customers browse without signup and order straight from WhatsApp." },
];

export default function LandingPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-brand-50 via-white to-white">
        {/* Blurred shop/marketplace backdrop */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 scale-105 bg-cover bg-center opacity-[0.16] blur-[1.2px]"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1600&auto=format&fit=crop')",
          }}
        />
        {/* Soften the image into the page so hero text stays crisp */}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-white/40 via-white/30 to-white" />
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 top-40 h-72 w-72 rounded-full bg-brand-200/30 blur-3xl" />
        <div className="relative mx-auto grid w-full max-w-[1600px] items-center gap-12 px-4 py-16 sm:px-6 sm:py-20 lg:grid-cols-2 lg:px-8">
          <div className="animate-fade-in-up">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-700 shadow-sm ring-1 ring-brand-100">
              <Sparkles className="h-3.5 w-3.5 text-accent-500" />
              For WhatsApp & Instagram sellers
            </span>
            <h1 className="mt-4 text-4xl font-bold tracking-tight text-brand-900 sm:text-5xl">
              Your shop, in{" "}
              <span className="relative whitespace-nowrap text-accent-500">
                one link
                <svg className="absolute -bottom-1 left-0 h-2 w-full text-accent-300" viewBox="0 0 100 8" preserveAspectRatio="none">
                  <path d="M0 6 Q 25 0 50 4 T 100 3" stroke="currentColor" strokeWidth="2" fill="none" />
                </svg>
              </span>
              .
            </h1>
            <p dir="rtl" className="mt-2 text-lg text-slate-500">{SITE_TAGLINE_UR}</p>
            <p className="mt-4 max-w-lg text-lg text-slate-600">
              Build a mobile-friendly catalog, get a public shop link, and take
              orders directly on WhatsApp — no website, no app, no code.
            </p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Button href="/signup" variant="accent" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Create your store
              </Button>
              <Button href="/store/ayesha-boutique" size="lg" variant="outline">
                View a sample shop
              </Button>
            </div>
            <ul className="mt-7 flex flex-wrap gap-x-5 gap-y-2">
              {TRUST.map((t) => (
                <li key={t} className="flex items-center gap-1.5 text-sm text-slate-500">
                  <Check className="h-4 w-4 text-leaf-500" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="animate-fade-in-up [animation-delay:120ms] lg:pl-6">
            <HeroPreview />
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="mx-auto w-full max-w-[1600px] px-4 py-16 sm:px-6 lg:px-8">
        <h2 className="text-center text-2xl font-bold text-brand-900">How it works</h2>
        <div className="stagger mt-10 grid gap-6 sm:grid-cols-3">
          {STEPS.map((s, i) => (
            <Card
              key={s.title}
              className="p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:shadow-brand-900/5"
              style={{ "--i": i } as React.CSSProperties}
            >
              <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${s.tone}`}>
                <s.icon className="h-6 w-6" />
              </div>
              <p className="mt-4 text-xs font-semibold text-accent-500">STEP {i + 1}</p>
              <h3 className="mt-1 text-lg font-semibold text-slate-900">{s.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{s.text}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-16">
        <div className="mx-auto w-full max-w-[1600px] px-4 sm:px-6 lg:px-8">
          <div className="grid gap-8 sm:grid-cols-3">
            {FEATURES.map((f) => (
              <div key={f.title} className="flex gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-700">
                  <f.icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{f.title}</h3>
                  <p className="mt-1 text-sm text-slate-500">{f.text}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Plans */}
      <section className="mx-auto w-full max-w-[1600px] px-4 py-16 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-brand-900">Simple, affordable plans</h2>
          <p className="mt-2 text-slate-500">Upgrade as your shop grows.</p>
        </div>
        <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PLAN_LIST.map((plan) => {
            const popular = plan.id === "growth";
            return (
              <Card
                key={plan.id}
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
                  <span className="text-3xl font-bold text-brand-900">
                    {formatPrice(plan.price)}
                  </span>
                  <span className="text-sm text-slate-400">/mo</span>
                </p>
                <ul className="mt-4 space-y-2 text-sm text-slate-600">
                  {plan.highlights.map((h) => (
                    <li key={h} className="flex items-start gap-2">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-leaf-500" />
                      {h}
                    </li>
                  ))}
                </ul>
                <Button
                  href="/signup"
                  variant={popular ? "accent" : "outline"}
                  fullWidth
                  className="mt-6"
                >
                  Choose {plan.name}
                </Button>
              </Card>
            );
          })}
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto w-full max-w-[1600px] px-4 pb-20 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl bg-brand-800 px-8 py-12 text-center text-white">
          <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent-500/30 blur-2xl" />
          <div className="pointer-events-none absolute -bottom-10 -left-10 h-40 w-40 rounded-full bg-gold-500/20 blur-2xl" />
          <h2 className="relative text-2xl font-bold">Ready to start selling?</h2>
          <p className="relative mx-auto mt-2 max-w-md text-brand-100">
            Join sellers across Pakistan turning followers into customers.
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
    </>
  );
}
