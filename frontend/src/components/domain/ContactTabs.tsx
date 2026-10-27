"use client";

import { useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  CheckCircle2,
  HelpCircle,
  Loader2,
  Mail,
  MapPin,
  MessageCircle,
  PackageSearch,
  Phone,
  Send,
  Store,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui";
import { CopyEmailButton } from "@/components/domain/CopyEmailButton";
import { useSendContactFormMutation } from "@/store/apiSlice";
import { SITE_EMAIL, SITE_NAME, SITE_PHONE } from "@/lib/constants";

const GMAIL_COMPOSE = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(SITE_EMAIL)}`;

const ADDRESS_LINE1 = "House No. 8, Mehmood Ghaznavi Road";
const ADDRESS_LINE2 = "Qadhafi Colony, Badami Bagh";
const ADDRESS_LINE3 = "Lahore, Punjab — Ravi Town";
const MAPS_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3401.5!2d74.3344!3d31.5833!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzHCsDM1JzAwLjAiTiA3NMKwMjAnMDMuOCJF!5e0!3m2!1sen!2spk!4v1700000000000!5m2!1sen!2spk";
const MAPS_LINK =
  "https://maps.google.com/?q=Mehmood+Ghaznavi+Road+House+8+Qadhafi+Colony+Badami+Bagh+Lahore+Punjab";

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
    text: "See the status of orders you've placed on Bazarnagar.",
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

type Tab = "contact" | "address";

export function ContactTabs() {
  const [tab, setTab] = useState<Tab>("contact");
  const [form, setForm] = useState({ name: "", email: "", subject: "", message: "" });
  const [errors, setErrors] = useState<Partial<typeof form>>({});
  const [sent, setSent] = useState(false);

  const [sendForm, { isLoading }] = useSendContactFormMutation();

  function validate() {
    const e: Partial<typeof form> = {};
    if (!form.name.trim()) e.name = "Name is required";
    if (!form.email.trim()) e.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Enter a valid email";
    if (!form.subject.trim()) e.subject = "Subject is required";
    if (form.message.trim().length < 10) e.message = "Message must be at least 10 characters";
    return e;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    try {
      await sendForm(form).unwrap();
      setSent(true);
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setErrors({ message: "Something went wrong. Please try again." });
    }
  }

  return (
    <>
      {/* Tab switcher */}
      <div className="mb-8 inline-flex rounded-xl border border-slate-200 bg-slate-50 p-1">
        <button
          onClick={() => setTab("contact")}
          className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
            tab === "contact"
              ? "bg-white text-brand-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <MessageCircle className="h-4 w-4" />
          Contact Us
        </button>
        <button
          onClick={() => setTab("address")}
          className={`flex items-center gap-2 rounded-lg px-5 py-2.5 text-sm font-medium transition-all ${
            tab === "address"
              ? "bg-white text-brand-700 shadow-sm"
              : "text-slate-500 hover:text-slate-700"
          }`}
        >
          <MapPin className="h-4 w-4" />
          Our Address
        </button>
      </div>

      {/* ── Contact tab ── */}
      {tab === "contact" && (
        <>
          {/* Channel cards */}
          <div className="grid gap-5 md:grid-cols-2">
            {/* WhatsApp */}
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
                +92 324 1201757
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

            {/* Email */}
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

          {/* Contact form */}
          <div className="mt-10 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-6 flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
                <Send className="h-5 w-5" />
              </span>
              <div>
                <h2 className="text-lg font-semibold text-slate-900">Send us a message</h2>
                <p className="text-sm text-slate-500">Fill the form and we&apos;ll get back within 24 hours.</p>
              </div>
            </div>

            {sent ? (
              <div className="flex flex-col items-center gap-3 py-10 text-center">
                <CheckCircle2 className="h-14 w-14 text-leaf-500" />
                <p className="text-lg font-semibold text-slate-900">Message sent!</p>
                <p className="text-sm text-slate-500">Thanks for reaching out. We&apos;ll reply as soon as possible.</p>
                <button
                  onClick={() => setSent(false)}
                  className="mt-2 text-sm text-brand-600 underline-offset-2 hover:underline"
                >
                  Send another message
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="grid gap-5 sm:grid-cols-2">
                {/* Name */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Full Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="Your name"
                    value={form.name}
                    onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  />
                  {errors.name && <p className="text-xs text-red-500">{errors.name}</p>}
                </div>

                {/* Email */}
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-slate-700">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  />
                  {errors.email && <p className="text-xs text-red-500">{errors.email}</p>}
                </div>

                {/* Subject */}
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="What is this about?"
                    value={form.subject}
                    onChange={(e) => setForm((f) => ({ ...f, subject: e.target.value }))}
                    className="rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  />
                  {errors.subject && <p className="text-xs text-red-500">{errors.subject}</p>}
                </div>

                {/* Message */}
                <div className="flex flex-col gap-1.5 sm:col-span-2">
                  <label className="text-sm font-medium text-slate-700">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={5}
                    placeholder="Tell us what you need help with…"
                    value={form.message}
                    onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))}
                    className="resize-none rounded-xl border border-slate-200 px-4 py-2.5 text-sm outline-none transition focus:border-brand-400 focus:ring-2 focus:ring-brand-100"
                  />
                  {errors.message && <p className="text-xs text-red-500">{errors.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="inline-flex items-center gap-2 rounded-xl bg-brand-700 px-6 py-3 text-sm font-semibold text-white shadow transition hover:bg-brand-800 disabled:opacity-60"
                  >
                    {isLoading ? (
                      <><Loader2 className="h-4 w-4 animate-spin" /> Sending…</>
                    ) : (
                      <><Send className="h-4 w-4" /> Send Message</>
                    )}
                  </button>
                </div>
              </form>
            )}
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
        </>
      )}

      {/* ── Address tab ── */}
      {tab === "address" && (
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Info panel */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                <MapPin className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">Our Office</h2>
              <address className="mt-3 space-y-1 not-italic text-slate-600">
                <p className="font-medium text-slate-900">{SITE_NAME}</p>
                <p>{ADDRESS_LINE1}</p>
                <p>{ADDRESS_LINE2}</p>
                <p>{ADDRESS_LINE3}</p>
              </address>

              <a
                href={MAPS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-flex items-center gap-2 rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-brand-800"
              >
                <MapPin className="h-4 w-4" />
                Open in Google Maps
              </a>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 font-semibold text-slate-900">Get in touch</h3>
              <ul className="space-y-2 text-sm text-slate-600">
                <li className="flex items-center gap-2">
                  <MessageCircle className="h-4 w-4 shrink-0 text-green-600" />
                  <a href={`https://wa.me/${SITE_PHONE}`} target="_blank" rel="noopener noreferrer" className="hover:text-brand-700 hover:underline">
                    Chat on WhatsApp
                  </a>
                </li>
                <li className="flex items-center gap-2">
                  <Mail className="h-4 w-4 shrink-0 text-brand-600" />
                  <a href={`mailto:${SITE_EMAIL}`} className="hover:text-brand-700 hover:underline">{SITE_EMAIL}</a>
                </li>
              </ul>
            </div>
          </div>

          {/* Map */}
          <div className="overflow-hidden rounded-3xl border border-slate-200 shadow-sm lg:col-span-3">
            <iframe
              title={`${SITE_NAME} office location`}
              src={MAPS_EMBED_URL}
              width="100%"
              height="450"
              style={{ border: 0, display: "block" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      )}
    </>
  );
}
