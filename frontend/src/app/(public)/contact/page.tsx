import type { Metadata } from "next";
import Link from "next/link";
import { Clock, HelpCircle, Mail, MessageCircle, Phone, Store } from "lucide-react";
import { Button, Card } from "@/components/ui";
import { CopyEmailButton } from "@/components/domain/CopyEmailButton";
import { SITE_EMAIL, SITE_NAME, SITE_PHONE, SITE_PHONE_DISPLAY } from "@/lib/constants";

export const metadata: Metadata = {
  title: `Contact us · ${SITE_NAME}`,
  description: `Get in touch with the ${SITE_NAME} team at ${SITE_EMAIL} or ${SITE_PHONE_DISPLAY}.`,
};

// Opens Gmail's compose window in the browser — works even when the visitor
// has no desktop email app set up for mailto: links.
const GMAIL_COMPOSE = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(SITE_EMAIL)}`;

export default function ContactPage() {
  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-12 sm:px-6 lg:py-16">
      <h1 className="text-3xl font-bold tracking-tight text-brand-900 sm:text-4xl">Contact us</h1>
      <p className="mt-3 text-slate-500">
        Questions about selling, your store, an order or anything else? We&apos;re happy to help.
      </p>

      <Card className="mt-8 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brand-50 text-brand-700">
            <Mail className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Email us at</p>
            <p className="break-all text-lg font-semibold text-slate-900">{SITE_EMAIL}</p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button href={GMAIL_COMPOSE} target="_blank" leftIcon={<Mail className="h-4 w-4" />}>
            Write in Gmail
          </Button>
          <Button href={`mailto:${SITE_EMAIL}`} variant="outline">
            Open email app
          </Button>
          <CopyEmailButton email={SITE_EMAIL} />
        </div>

        <p className="mt-5 flex items-center gap-2 text-sm text-slate-500">
          <Clock className="h-4 w-4 text-slate-400" />
          We typically respond within 24 hours.
        </p>
      </Card>

      <Card className="mt-4 p-6 sm:p-8">
        <div className="flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-leaf-500/10 text-leaf-600">
            <Phone className="h-5 w-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm text-slate-500">Call or WhatsApp us</p>
            <a href={`tel:+${SITE_PHONE}`} className="text-lg font-semibold text-slate-900 hover:underline">
              {SITE_PHONE_DISPLAY}
            </a>
          </div>
        </div>

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
      </Card>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <Link
          href="/how-it-works"
          className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-brand-300"
        >
          <HelpCircle className="mt-0.5 h-5 w-5 text-brand-600" />
          <div>
            <p className="font-medium text-slate-900">How it works &amp; FAQs</p>
            <p className="mt-0.5 text-sm text-slate-500">Quick answers to common questions.</p>
          </div>
        </Link>
        <Link
          href="/signup?role=seller"
          className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-white p-5 transition-colors hover:border-brand-300"
        >
          <Store className="mt-0.5 h-5 w-5 text-brand-600" />
          <div>
            <p className="font-medium text-slate-900">Start selling</p>
            <p className="mt-0.5 text-sm text-slate-500">Create your free store in minutes.</p>
          </div>
        </Link>
      </div>
    </div>
  );
}
