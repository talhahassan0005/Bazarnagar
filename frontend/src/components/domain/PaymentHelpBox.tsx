"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { LifeBuoy, Mail, MessageCircle } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { SITE_EMAIL, SITE_PHONE } from "@/lib/constants";

/**
 * Shown on /contact?topic=payment (linked from payment screens). Asks for the
 * email the seller has / wants to create their account with, and pre-fills it
 * into the WhatsApp and email messages so the team can find the account.
 */
export function PaymentHelpBox() {
  const params = useSearchParams();
  const [email, setEmail] = useState(params.get("email") ?? "");
  if (params.get("topic") !== "payment") return null;

  const message = [
    "Hi Bazaarnagar team, I'm facing a problem with a payment.",
    email.trim() ? `My account email: ${email.trim()}` : "",
    "Problem: ",
  ]
    .filter(Boolean)
    .join("\n");
  const whatsapp = `https://wa.me/${SITE_PHONE}?text=${encodeURIComponent(message)}`;
  const gmail = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(SITE_EMAIL)}&su=${encodeURIComponent(
    "Payment problem"
  )}&body=${encodeURIComponent(message)}`;

  return (
    <div className="mb-8 rounded-3xl border border-accent-200 bg-accent-50/60 p-6 sm:p-8">
      <div className="flex items-start gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-accent-600 shadow-sm">
          <LifeBuoy className="h-5 w-5" />
        </span>
        <div>
          <h2 className="text-lg font-semibold text-slate-900">If you are facing any problem, contact us</h2>
          <p className="mt-1 text-sm text-slate-600">
            Tell us the email of your seller account — or the email you want to create your account with — so we can
            help you faster.
          </p>
        </div>
      </div>
      <div className="mt-5 max-w-md">
        <Input
          type="email"
          label="Your account email"
          placeholder="you@example.com"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
      </div>
      <div className="mt-4 flex flex-wrap gap-3">
        <Button href={whatsapp} target="_blank" variant="whatsapp" leftIcon={<MessageCircle className="h-4 w-4" />}>
          Message us on WhatsApp
        </Button>
        <Button href={gmail} target="_blank" variant="outline" leftIcon={<Mail className="h-4 w-4" />}>
          Email us
        </Button>
      </div>
    </div>
  );
}
