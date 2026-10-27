import type { Metadata } from "next";
import { Mail, MapPin, MessageCircle } from "lucide-react";
import { SITE_EMAIL, SITE_NAME, SITE_PHONE } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Our Address · ${SITE_NAME}`,
  description: `Visit ${SITE_NAME} at Mehmood Ghaznavi Road, Qadhafi Colony, Badami Bagh, Lahore.`,
};

const MAPS_EMBED_URL =
  "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3401.5!2d74.3344!3d31.5833!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zMzHCsDM1JzAwLjAiTiA3NMKwMjAnMDMuOCJF!5e0!3m2!1sen!2spk!4v1700000000000!5m2!1sen!2spk";
const MAPS_LINK =
  "https://maps.google.com/?q=Mehmood+Ghaznavi+Road+House+8+Qadhafi+Colony+Badami+Bagh+Lahore+Punjab";

export default function AddressPage() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-brand-50 via-white to-white">
        <div className="pointer-events-none absolute -right-24 -top-24 h-80 w-80 rounded-full bg-accent-200/30 blur-3xl" />
        <div className="pointer-events-none absolute -left-24 top-24 h-72 w-72 rounded-full bg-brand-200/30 blur-3xl" />
        <div className="relative mx-auto w-full max-w-5xl px-4 py-12 text-center sm:px-6 sm:py-16">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-xs font-medium text-brand-700 shadow-sm ring-1 ring-brand-100">
            <MapPin className="h-3.5 w-3.5 text-accent-500" />
            Find us here
          </span>
          <h1 className="mt-4 text-4xl font-bold tracking-tight text-brand-900 sm:text-5xl">
            Our <span className="text-accent-500">Address</span>
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-lg text-slate-600">
            Come visit us or send us a message — we&apos;re always happy to help.
          </p>
        </div>
      </section>

      <div className="mx-auto w-full max-w-5xl px-4 py-12 sm:px-6">
        <div className="grid gap-8 lg:grid-cols-5">
          {/* Info panel */}
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-brand-50 text-brand-700">
                <MapPin className="h-6 w-6" />
              </span>
              <h2 className="mt-4 text-lg font-semibold text-slate-900">Office Address</h2>
              <address className="mt-3 space-y-1 not-italic text-slate-600">
                <p className="font-semibold text-slate-900">{SITE_NAME}</p>
                <p>House No. 8, Mehmood Ghaznavi Road</p>
                <p>Qadhafi Colony, Badami Bagh</p>
                <p>Lahore, Punjab — Ravi Town</p>
              </address>

              <a
                href={MAPS_LINK}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-6 inline-flex items-center gap-2 rounded-xl bg-brand-700 px-5 py-2.5 text-sm font-semibold text-white shadow transition hover:bg-brand-800"
              >
                <MapPin className="h-4 w-4" />
                Open in Google Maps
              </a>
            </div>

            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-4 font-semibold text-slate-900">Get in touch</h3>
              <ul className="space-y-3 text-sm text-slate-600">
                <li className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-green-50 text-green-600">
                    <MessageCircle className="h-4 w-4" />
                  </span>
                  <a
                    href={`https://wa.me/${SITE_PHONE}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-brand-700 hover:underline"
                  >
                    Chat on WhatsApp
                  </a>
                </li>
                <li className="flex items-center gap-2.5">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
                    <Mail className="h-4 w-4" />
                  </span>
                  <a href={`mailto:${SITE_EMAIL}`} className="hover:text-brand-700 hover:underline">
                    {SITE_EMAIL}
                  </a>
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
              height="480"
              style={{ border: 0, display: "block" }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>
      </div>
    </>
  );
}
